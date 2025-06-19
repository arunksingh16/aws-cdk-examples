# Creating CDK Stack from very basic


- Create a package.json file(can be used to set up a new or existing npm package)
```
npm init -y
```

- Install npm modules and dependencies to arbitrary places from code
```
npm i -D aws-cdk-lib constructs ts-node typescript
```

- Generating tsconfig.json
```
npx tsc --init
```

- to see where npm install -g is putting files
```
npm config get prefix
```

### NPM vs NPX
NPM - Manages packages but doesn't make life easy executing any.
NPX - A tool for executing Node packages.
