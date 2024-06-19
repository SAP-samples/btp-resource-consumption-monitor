# UI5 custom control `ui5-cc-md`

This namespace contains a custom control rendering regular + github-flavored Markdown content, either provided as a string or from a file.  
It outputs plain HTML, ready to be included in an XML view.

## Install

```bash
$> yarn add ui5-cc-md
# or
$> npm install ui5-cc-md
```

## Included controls

- `Markdown`: transforms Markdown to HTML
  - properties: (note: either `content` or `fromFile` can be used, not both)
    - `content: <String>`: Markdown as raw string
    - `fromFile: <Path>`: relative path to a file containing Markdwon
  - aggregations: -

## Usage

1. define the dependeny in `$yourapp/package.json`

   ```json
   // it is already in "dependencies" after installation
   "ui5": {
     "dependencies": [
       // ...
       "ui5-cc-md",
       // ...
     ]
   }
   ```

2. declare the namespace in your XML view and use the custom control from that namespace

   ```xml
   <mvc:View ... 
           xmlns:md="cc.md"
           ...>
      <md:Markdown content="***markdown is nice!***&#13;&#10;&#13;&#10;if only there wasn't the CR problem in XML view string" />
      <md:Markdown fromFile="./fragment.md" />
      <md:Markdown content="{/markdownContent}" />
   </mvc:View>
   ```

## How it works

`Markdown` uses the [npm module `marked`](https://marked.js.org) for transforming content from Markdown to HTML.

## Build time (in apps)

Use `ui5 build --all` to produce a deployable version of your app including `ui5-cc-md` and its’ control(s).

Other than that, nothing specific to note for using `ui5-cc-md` in builds in UI5 apps.

## Tests

The `test` folder contains a minimal UI5 app requiring `ui5-cc-md`. 

For testing manually, do:

```bash
$> yarn test:manual # runs ui5 serve
# now point a browser to http://localhost:8080
```

The [livereload middleware](https://github.com/petermuessig/ui5-ecosystem-showcase/tree/master/packages/ui5-middleware-livereload) is included, so changes to the test app get reloaded immediately.

A full automated test suite is setup with [Jest + puppeteer](https://jestjs.io/docs/en/puppeteer), starting `ui5 serve` and running all `/test/**/*.test.js` :

```bash
$> cd test/ui5-app
$> yarn # for installing runtime dependencies
$> cd ..
$> yarn test
# sample output:
 PASS  test/ui5-app/basic.test.js
  Markdown
    ✓ should render markdown via content property (2374 ms)
    ✓ should render markdown via fromFile property (854 ms)
    ✓ should render markdown via binding (672 ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        4.512 s, estimated 5 s
Ran all test suites.
✨  Done in 11.90s.
```

## License

This work is [dual-licensed](./LICENSE) under Apache 2.0 and the Derived Beer-ware License. The official license will be Apache 2.0, but ultimately you can choose between one of them if you use this work.

When you like this stuff, buy [@vobu](https://twitter.com/vobu),  [@matz3](https://twitter.com/matthiaso), [@wridgeu](https://twitter.com/wridgeu) a beer or buy [@pmuessig](https://twitter.com/pmuessig) a coke when you see them.