# Tiny Are.na RN client (10-2023)

> Project was scrapped due to Are.na GraphQL API limitations (not meant for public use).

Simple React Native client for [Are.na](https://www.are.na/). Also there are few occurrences of hacks/mix of business logic and UI in the codebase (was build in over few days)

## Features

- Login with Are.na (OAuth)
- [FlashList](https://github.com/Shopify/flash-list) for performant infinite scroll
- Custom image viewer with pinch to zoom
- GraphQL client with GraphQL Codegen for type safety
- View channels
- View all block types
- Navigation with [Expo Router](https://docs.expo.dev/router/introduction/)

## Structure

- [auth/](auth/) - Contains basic OAuth service for Are.na login
- [app/](app/) - Main RN app

<video src=".github/demo.mp4" width="100%" style="max-width:350px;" controls></video>
