# BitbucketStrategy

The Bitbucket Cloud strategy for [remix-auth](https://github.com/sergiodxa/remix-auth) is used to authenticate users against a Bitbucket Cloud account. It extends the OAuth2Strategy.

## Supported runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

## Usage

### Create an OAuth application

Follow the steps on [the Bitbucket Cloud documentation](https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud/) to create a new application and get a client ID and secret.

### Create the strategy instance

```ts
import { BitbucketStrategy } from "remix-auth-bitbucket";

let bitbucketStrategy = new BitbucketStrategy(
  {
    clientID: "YOUR_CLIENT_ID",
    clientSecret: "YOUR_CLIENT_SECRET",
    callbackURL: "https://example.com/auth/bitbucket/callback",
  },
  async ({ accessToken, extraParams, profile }) => {
    // Get the user data from your DB or API using the tokens and profile
    return User.findOrCreate({ email: profile.emails[0].value });
  }
);

authenticator.use(bitbucketStrategy);
```

### Setup your routes

```tsx
// app/routes/login.tsx
export default function Login() {
  return (
    <Form action="/auth/bitbucket" method="post">
      <button>Login with Bitbucket</button>
    </Form>
  );
}
```

```tsx
// app/routes/auth/bitbucket.tsx
import { ActionFunction, LoaderFunction, redirect } from "remix";
import { authenticator } from "~/auth.server";

export let loader: LoaderFunction = () => redirect("/login");

export let action: ActionFunction = ({ request }) => {
  return authenticator.authenticate("bitbucket", request);
};
```

```tsx
// app/routes/auth/bitbucket/callback.tsx
import { LoaderFunction } from "remix";
import { authenticator } from "~/auth.server";

export let loader: LoaderFunction = ({ request }) => {
  return authenticator.authenticate("bitbucket", request, {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
  });
};
```

### Aknowledgements

[@sergiodxa](https://github.com/sergiodxa): for [remix-auth](https://github.com/sergiodxa/remix-auth), [remix-auth-strategy-template](https://github.com/sergiodxa/remix-auth-strategy-template) and for so many repositories and blog posts that make Remix easier to use and learn.
