# ManagedEnv

[![Publish Package to npmjs](https://github.com/GalvinPython/managedenv/actions/workflows/main.yml/badge.svg)](https://github.com/GalvinPython/managedenv/actions/workflows/main.yml)
[![NPM Version](https://img.shields.io/npm/v/managedenv)](https://www.npmjs.com/package/managedenv)

Notice: ManagedEnv is currently in beta

ManagedEnv is a lightweight, zero-dependency environment variable management package. It allows you to define, load, and validate environment variables with ease, making it a powerful tool for managing your application's configuration and environment variables.

# Features

Features of ManagedEnv are that:

- It's type-safe
- Auto-casted typings means that you can easily see variables that exist or don't exist
- Declare required and optional variables
- Scope your variables to different projects (useful in monorepo settings)
- Set fallback environment variables (such as ports)

# Example Usage

As ManagedEnv is in beta, there's likely to be future API changes, however this how you use the current API:

Lets assume in your project, you have a `.env` file that looks like

```bash
API_KEY=test
```

In your file (for example `index.ts`):

```ts
// Import the EnvManager class from managedenv
import { EnvManager } from "managedenv";

// Create a new instance, but remember to call `.add()` to the end of it
const envManager = new EnvManager().add({
  name: "API_KEY",
  required: false,
});

// Load the variables using the `.load()` function
const envs = envManager.load();

// To verify it works
console.log("API_KEY:", envs.env.API_KEY);
```

Now this has native support for Bun at the moment, so in your terminal run your file and verify the output:

```bash
$ bun index.ts
```

```bash
API_KEY: test
```

# Changelog

## Preview

### 0.1.0

- Added documentation
- First release

### 0.0.1

_Note: This version was never published_

- Initial commit
