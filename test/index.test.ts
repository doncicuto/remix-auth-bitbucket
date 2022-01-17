import { createCookieSessionStorage } from "@remix-run/server-runtime";
import { BitbucketStrategy } from "../src";

export const BitbucketTest = describe(BitbucketStrategy, () => {
  const verify = jest.fn();
  const sessionStorage = createCookieSessionStorage({
    cookie: { secrets: ["s3cr3t"] },
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("should allow changing the scope", async () => {
    const strategy = new BitbucketStrategy(
      {
        clientID: "CLIENT_ID",
        clientSecret: "CLIENT_SECRET",
        callbackURL: "https://example.app/callback",
        scope: ["email"],
      },
      verify
    );

    const request = new Request("https://example.app/auth/bitbucket");

    try {
      await strategy.authenticate(request, sessionStorage, {
        sessionKey: "user",
      });
    } catch (error) {
      if (!(error instanceof Response)) throw error;
      const location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      const redirectUrl = new URL(location);

      expect(redirectUrl.searchParams.get("scope")).toBe("email");
    }
  });

  test("should have the default scope", async () => {
    const strategy = new BitbucketStrategy(
      {
        clientID: "CLIENT_ID",
        clientSecret: "CLIENT_SECRET",
        callbackURL: "https://example.app/callback",
      },
      verify
    );

    const request = new Request("https://example.app/auth/bitbucket");

    try {
      await strategy.authenticate(request, sessionStorage, {
        sessionKey: "user",
      });
    } catch (error) {
      if (!(error instanceof Response)) throw error;
      const location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      const redirectUrl = new URL(location);

      expect(redirectUrl.searchParams.get("scope")).toBe(["account"].join(" "));
    }
  });

  test("should correctly format the authorization URL", async () => {
    const strategy = new BitbucketStrategy(
      {
        clientID: "CLIENT_ID",
        clientSecret: "CLIENT_SECRET",
        callbackURL: "https://example.app/callback",
      },
      verify
    );

    const request = new Request("https://example.app/auth/gilab");

    try {
      await strategy.authenticate(request, sessionStorage, {
        sessionKey: "user",
      });
    } catch (error) {
      if (!(error instanceof Response)) throw error;

      const location = error.headers.get("Location");

      if (!location) throw new Error("No redirect header");

      const redirectUrl = new URL(location);

      expect(redirectUrl.hostname).toBe("bitbucket.org");
      expect(redirectUrl.pathname).toBe("/site/oauth2/authorize");
    }
  });
});
