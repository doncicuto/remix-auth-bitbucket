import { OAuth2Strategy } from "remix-auth-oauth2";
import createDebug from "debug";
import type { StrategyVerifyCallback } from "remix-auth";
import type {
  OAuth2Profile,
  OAuth2StrategyVerifyParams,
} from "remix-auth-oauth2";

let debug = createDebug("RemixAuthBitbucket");

// Bitbucket OAuth2 scopes: https://docs.bitbucket.com/ee/integration/oauth_provider.html#authorized-applications
export type BitbucketScope =
  | "account"
  | "account:write"
  | "team"
  | "team:write"
  | "repository"
  | "repository:write"
  | "repository:admin"
  | "pullRequest"
  | "pullRequest:write"
  | "snippet"
  | "snippet:write"
  | "issue"
  | "issue:write"
  | "wiki"
  | "email"
  | "webhook"
  | "pipeline"
  | "pipeline:write"
  | "pipeline:variable"
  | "runner"
  | "runner:write";

export interface BitbucketStrategyOptions {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope?: BitbucketScope[];
  userAgent?: string;
}

export interface BitbucketProfile extends OAuth2Profile {
  id: string;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
    middleName: string;
  };
  emails: [{ value: string }];
  photos: [{ value: string }];
  _json: {
    username: string;
    has_2fa_enabled: boolean | null;
    display_name: string;
    account_id: string;
    links: {
      hooks: { href: string };
      self: { href: string };
      repositories: { href: string };
      html: { href: string };
      avatar: { href: string };
      snippets: { href: string };
    };
    nickname: string;
    created_on: string;
    is_staff: boolean;
    location: string | null;
    account_status: string;
    type: string;
    uuid: string;
    emails: unknown;
  };
}

export interface BitbucketExtraParams extends Record<string, string | number> {
  tokenType: string;
}

export class BitbucketStrategy<User> extends OAuth2Strategy<
  User,
  BitbucketProfile,
  BitbucketExtraParams
> {
  name = "bitbucket";

  private scope: BitbucketScope[];
  private userAgent: string;
  private userInfoURL = "https://api.bitbucket.org/2.0/user";
  private userEmailURL = "https://api.bitbucket.org/2.0/user/emails";

  constructor(
    {
      clientID,
      clientSecret,
      callbackURL,
      scope,
      userAgent,
    }: BitbucketStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<BitbucketProfile, BitbucketExtraParams>
    >
  ) {
    super(
      {
        clientID,
        clientSecret,
        callbackURL,
        authorizationURL: "https://bitbucket.org/site/oauth2/authorize",
        tokenURL: "https://bitbucket.org/site/oauth2/access_token",
      },
      verify
    );
    this.scope = scope ?? ["account"];
    this.userAgent = userAgent ?? "Remix Auth";
  }

  protected authorizationParams(): URLSearchParams {
    return new URLSearchParams({
      scope: this.scope.join(" "),
    });
  }

  protected async userProfile(accessToken: string): Promise<BitbucketProfile> {
    let profile: BitbucketProfile;

    try {
      let response = await fetch(this.userInfoURL, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": this.userAgent,
        },
      });

      let data = await response.json();
      debug("Calling User Profile API - Response", data);

      profile = {
        provider: "bitbucket",
        displayName: data.username,
        id: String(data.account_id),
        name: {
          familyName: data.display_name,
          givenName: data.display_name,
          middleName: data.display_name,
        },
        emails: [{ value: "" }],
        photos: [{ value: data.links.avatar.href }],
        _json: data,
      };

      debug("Profile", profile);
    } catch (error) {
      throw new Error(`Could not parse user account emails. ${error}`);
    }

    try {
      let response = await fetch(this.userEmailURL, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": this.userAgent,
        },
      });

      let data = await response.json();
      debug("Calling User Email API - Response", data);

      if (data.values.length > 0) {
        profile.emails = data.values.map((item: { email: string }) => ({
          value: item.email,
        }));
        profile._json.emails = data.values;
      }
    } catch (error) {
      throw new Error(`Could not parse user account emails. ${error}`);
    }

    debug("Profile with emails", profile);

    return profile;
  }

  protected async getAccessToken(response: Response): Promise<{
    accessToken: string;
    refreshToken: string;
    extraParams: BitbucketExtraParams;
  }> {
    let { access_token, refresh_token, ...extraParams } = await response.json();
    debug("Retrieved AccessToken", access_token);
    debug("Retrieved RefreshToken", refresh_token);
    return {
      accessToken: access_token as string,
      refreshToken: refresh_token as string,
      extraParams,
    } as const;
  }
}
