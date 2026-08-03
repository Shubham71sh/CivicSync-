# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetUser*](#getuser)
  - [*ListUsers*](#listusers)
  - [*GetApplication*](#getapplication)
  - [*ListApplications*](#listapplications)
  - [*GetNotification*](#getnotification)
  - [*ListNotifications*](#listnotifications)
  - [*GetPolicy*](#getpolicy)
  - [*ListPolicies*](#listpolicies)
  - [*GetRoadmapItem*](#getroadmapitem)
  - [*ListRoadmapItems*](#listroadmapitems)
  - [*GetScheme*](#getscheme)
  - [*ListSchemes*](#listschemes)
- [**Mutations**](#mutations)
  - [*CreateUser*](#createuser)
  - [*UpdateUser*](#updateuser)
  - [*DeleteUser*](#deleteuser)
  - [*CreateApplication*](#createapplication)
  - [*UpdateApplication*](#updateapplication)
  - [*DeleteApplication*](#deleteapplication)
  - [*CreateNotification*](#createnotification)
  - [*UpdateNotification*](#updatenotification)
  - [*DeleteNotification*](#deletenotification)
  - [*CreatePolicy*](#createpolicy)
  - [*UpdatePolicy*](#updatepolicy)
  - [*DeletePolicy*](#deletepolicy)
  - [*CreateRoadmapItem*](#createroadmapitem)
  - [*UpdateRoadmapItem*](#updateroadmapitem)
  - [*DeleteRoadmapItem*](#deleteroadmapitem)
  - [*CreateScheme*](#createscheme)
  - [*UpdateScheme*](#updatescheme)
  - [*DeleteScheme*](#deletescheme)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetUser
You can execute the `GetUser` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUser(options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;

interface GetUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserData, undefined>;
}
export const getUserRef: GetUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;

interface GetUserRef {
  ...
  (dc: DataConnect): QueryRef<GetUserData, undefined>;
}
export const getUserRef: GetUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserRef:
```typescript
const name = getUserRef.operationName;
console.log(name);
```

### Variables
The `GetUser` query has no variables.
### Return Type
Recall that executing the `GetUser` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetUserData {
  user?: {
    email: string;
    riskScore: number;
  };
}
```
### Using `GetUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUser } from '@dataconnect/generated';


// Call the `getUser()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUser(dataConnect);

console.log(data.user);

// Or, you can use the `Promise` API.
getUser().then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetUser`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserRef } from '@dataconnect/generated';


// Call the `getUserRef()` function to get a reference to the query.
const ref = getUserRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## ListUsers
You can execute the `ListUsers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listUsers(options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;

interface ListUsersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUsersData, undefined>;
}
export const listUsersRef: ListUsersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;

interface ListUsersRef {
  ...
  (dc: DataConnect): QueryRef<ListUsersData, undefined>;
}
export const listUsersRef: ListUsersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listUsersRef:
```typescript
const name = listUsersRef.operationName;
console.log(name);
```

### Variables
The `ListUsers` query has no variables.
### Return Type
Recall that executing the `ListUsers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListUsersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListUsersData {
  users: ({
    id: UUIDString;
    email: string;
  } & User_Key)[];
}
```
### Using `ListUsers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listUsers } from '@dataconnect/generated';


// Call the `listUsers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listUsers();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listUsers(dataConnect);

console.log(data.users);

// Or, you can use the `Promise` API.
listUsers().then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

### Using `ListUsers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listUsersRef } from '@dataconnect/generated';


// Call the `listUsersRef()` function to get a reference to the query.
const ref = listUsersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listUsersRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.users);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

## GetApplication
You can execute the `GetApplication` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getApplication(options?: ExecuteQueryOptions): QueryPromise<GetApplicationData, undefined>;

interface GetApplicationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetApplicationData, undefined>;
}
export const getApplicationRef: GetApplicationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getApplication(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetApplicationData, undefined>;

interface GetApplicationRef {
  ...
  (dc: DataConnect): QueryRef<GetApplicationData, undefined>;
}
export const getApplicationRef: GetApplicationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getApplicationRef:
```typescript
const name = getApplicationRef.operationName;
console.log(name);
```

### Variables
The `GetApplication` query has no variables.
### Return Type
Recall that executing the `GetApplication` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetApplicationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetApplicationData {
  application?: {
    status: string;
    scheme: {
      name: string;
    };
  };
}
```
### Using `GetApplication`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getApplication } from '@dataconnect/generated';


// Call the `getApplication()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getApplication();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getApplication(dataConnect);

console.log(data.application);

// Or, you can use the `Promise` API.
getApplication().then((response) => {
  const data = response.data;
  console.log(data.application);
});
```

### Using `GetApplication`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getApplicationRef } from '@dataconnect/generated';


// Call the `getApplicationRef()` function to get a reference to the query.
const ref = getApplicationRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getApplicationRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.application);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.application);
});
```

## ListApplications
You can execute the `ListApplications` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listApplications(options?: ExecuteQueryOptions): QueryPromise<ListApplicationsData, undefined>;

interface ListApplicationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListApplicationsData, undefined>;
}
export const listApplicationsRef: ListApplicationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listApplications(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListApplicationsData, undefined>;

interface ListApplicationsRef {
  ...
  (dc: DataConnect): QueryRef<ListApplicationsData, undefined>;
}
export const listApplicationsRef: ListApplicationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listApplicationsRef:
```typescript
const name = listApplicationsRef.operationName;
console.log(name);
```

### Variables
The `ListApplications` query has no variables.
### Return Type
Recall that executing the `ListApplications` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListApplicationsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListApplicationsData {
  applications: ({
    id: UUIDString;
    status: string;
  } & Application_Key)[];
}
```
### Using `ListApplications`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listApplications } from '@dataconnect/generated';


// Call the `listApplications()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listApplications();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listApplications(dataConnect);

console.log(data.applications);

// Or, you can use the `Promise` API.
listApplications().then((response) => {
  const data = response.data;
  console.log(data.applications);
});
```

### Using `ListApplications`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listApplicationsRef } from '@dataconnect/generated';


// Call the `listApplicationsRef()` function to get a reference to the query.
const ref = listApplicationsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listApplicationsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.applications);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.applications);
});
```

## GetNotification
You can execute the `GetNotification` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getNotification(options?: ExecuteQueryOptions): QueryPromise<GetNotificationData, undefined>;

interface GetNotificationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetNotificationData, undefined>;
}
export const getNotificationRef: GetNotificationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getNotification(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetNotificationData, undefined>;

interface GetNotificationRef {
  ...
  (dc: DataConnect): QueryRef<GetNotificationData, undefined>;
}
export const getNotificationRef: GetNotificationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getNotificationRef:
```typescript
const name = getNotificationRef.operationName;
console.log(name);
```

### Variables
The `GetNotification` query has no variables.
### Return Type
Recall that executing the `GetNotification` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetNotificationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetNotificationData {
  notification?: {
    message: string;
  };
}
```
### Using `GetNotification`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getNotification } from '@dataconnect/generated';


// Call the `getNotification()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getNotification();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getNotification(dataConnect);

console.log(data.notification);

// Or, you can use the `Promise` API.
getNotification().then((response) => {
  const data = response.data;
  console.log(data.notification);
});
```

### Using `GetNotification`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getNotificationRef } from '@dataconnect/generated';


// Call the `getNotificationRef()` function to get a reference to the query.
const ref = getNotificationRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getNotificationRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.notification);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.notification);
});
```

## ListNotifications
You can execute the `ListNotifications` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listNotifications(options?: ExecuteQueryOptions): QueryPromise<ListNotificationsData, undefined>;

interface ListNotificationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListNotificationsData, undefined>;
}
export const listNotificationsRef: ListNotificationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listNotifications(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListNotificationsData, undefined>;

interface ListNotificationsRef {
  ...
  (dc: DataConnect): QueryRef<ListNotificationsData, undefined>;
}
export const listNotificationsRef: ListNotificationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listNotificationsRef:
```typescript
const name = listNotificationsRef.operationName;
console.log(name);
```

### Variables
The `ListNotifications` query has no variables.
### Return Type
Recall that executing the `ListNotifications` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListNotificationsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListNotificationsData {
  notifications: ({
    message: string;
  })[];
}
```
### Using `ListNotifications`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listNotifications } from '@dataconnect/generated';


// Call the `listNotifications()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listNotifications();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listNotifications(dataConnect);

console.log(data.notifications);

// Or, you can use the `Promise` API.
listNotifications().then((response) => {
  const data = response.data;
  console.log(data.notifications);
});
```

### Using `ListNotifications`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listNotificationsRef } from '@dataconnect/generated';


// Call the `listNotificationsRef()` function to get a reference to the query.
const ref = listNotificationsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listNotificationsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.notifications);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.notifications);
});
```

## GetPolicy
You can execute the `GetPolicy` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getPolicy(options?: ExecuteQueryOptions): QueryPromise<GetPolicyData, undefined>;

interface GetPolicyRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPolicyData, undefined>;
}
export const getPolicyRef: GetPolicyRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getPolicy(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetPolicyData, undefined>;

interface GetPolicyRef {
  ...
  (dc: DataConnect): QueryRef<GetPolicyData, undefined>;
}
export const getPolicyRef: GetPolicyRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getPolicyRef:
```typescript
const name = getPolicyRef.operationName;
console.log(name);
```

### Variables
The `GetPolicy` query has no variables.
### Return Type
Recall that executing the `GetPolicy` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetPolicyData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetPolicyData {
  policy?: {
    title: string;
  };
}
```
### Using `GetPolicy`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getPolicy } from '@dataconnect/generated';


// Call the `getPolicy()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getPolicy();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getPolicy(dataConnect);

console.log(data.policy);

// Or, you can use the `Promise` API.
getPolicy().then((response) => {
  const data = response.data;
  console.log(data.policy);
});
```

### Using `GetPolicy`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getPolicyRef } from '@dataconnect/generated';


// Call the `getPolicyRef()` function to get a reference to the query.
const ref = getPolicyRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getPolicyRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.policy);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.policy);
});
```

## ListPolicies
You can execute the `ListPolicies` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listPolicies(options?: ExecuteQueryOptions): QueryPromise<ListPoliciesData, undefined>;

interface ListPoliciesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPoliciesData, undefined>;
}
export const listPoliciesRef: ListPoliciesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listPolicies(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPoliciesData, undefined>;

interface ListPoliciesRef {
  ...
  (dc: DataConnect): QueryRef<ListPoliciesData, undefined>;
}
export const listPoliciesRef: ListPoliciesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPoliciesRef:
```typescript
const name = listPoliciesRef.operationName;
console.log(name);
```

### Variables
The `ListPolicies` query has no variables.
### Return Type
Recall that executing the `ListPolicies` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPoliciesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListPoliciesData {
  policies: ({
    title: string;
  })[];
}
```
### Using `ListPolicies`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listPolicies } from '@dataconnect/generated';


// Call the `listPolicies()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listPolicies();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listPolicies(dataConnect);

console.log(data.policies);

// Or, you can use the `Promise` API.
listPolicies().then((response) => {
  const data = response.data;
  console.log(data.policies);
});
```

### Using `ListPolicies`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPoliciesRef } from '@dataconnect/generated';


// Call the `listPoliciesRef()` function to get a reference to the query.
const ref = listPoliciesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPoliciesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.policies);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.policies);
});
```

## GetRoadmapItem
You can execute the `GetRoadmapItem` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getRoadmapItem(options?: ExecuteQueryOptions): QueryPromise<GetRoadmapItemData, undefined>;

interface GetRoadmapItemRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetRoadmapItemData, undefined>;
}
export const getRoadmapItemRef: GetRoadmapItemRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getRoadmapItem(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetRoadmapItemData, undefined>;

interface GetRoadmapItemRef {
  ...
  (dc: DataConnect): QueryRef<GetRoadmapItemData, undefined>;
}
export const getRoadmapItemRef: GetRoadmapItemRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getRoadmapItemRef:
```typescript
const name = getRoadmapItemRef.operationName;
console.log(name);
```

### Variables
The `GetRoadmapItem` query has no variables.
### Return Type
Recall that executing the `GetRoadmapItem` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetRoadmapItemData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetRoadmapItemData {
  roadmapItem?: {
    title: string;
  };
}
```
### Using `GetRoadmapItem`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getRoadmapItem } from '@dataconnect/generated';


// Call the `getRoadmapItem()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getRoadmapItem();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getRoadmapItem(dataConnect);

console.log(data.roadmapItem);

// Or, you can use the `Promise` API.
getRoadmapItem().then((response) => {
  const data = response.data;
  console.log(data.roadmapItem);
});
```

### Using `GetRoadmapItem`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getRoadmapItemRef } from '@dataconnect/generated';


// Call the `getRoadmapItemRef()` function to get a reference to the query.
const ref = getRoadmapItemRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getRoadmapItemRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.roadmapItem);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.roadmapItem);
});
```

## ListRoadmapItems
You can execute the `ListRoadmapItems` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listRoadmapItems(options?: ExecuteQueryOptions): QueryPromise<ListRoadmapItemsData, undefined>;

interface ListRoadmapItemsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListRoadmapItemsData, undefined>;
}
export const listRoadmapItemsRef: ListRoadmapItemsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listRoadmapItems(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListRoadmapItemsData, undefined>;

interface ListRoadmapItemsRef {
  ...
  (dc: DataConnect): QueryRef<ListRoadmapItemsData, undefined>;
}
export const listRoadmapItemsRef: ListRoadmapItemsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listRoadmapItemsRef:
```typescript
const name = listRoadmapItemsRef.operationName;
console.log(name);
```

### Variables
The `ListRoadmapItems` query has no variables.
### Return Type
Recall that executing the `ListRoadmapItems` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListRoadmapItemsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListRoadmapItemsData {
  roadmapItems: ({
    title: string;
    status: string;
  })[];
}
```
### Using `ListRoadmapItems`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listRoadmapItems } from '@dataconnect/generated';


// Call the `listRoadmapItems()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listRoadmapItems();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listRoadmapItems(dataConnect);

console.log(data.roadmapItems);

// Or, you can use the `Promise` API.
listRoadmapItems().then((response) => {
  const data = response.data;
  console.log(data.roadmapItems);
});
```

### Using `ListRoadmapItems`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listRoadmapItemsRef } from '@dataconnect/generated';


// Call the `listRoadmapItemsRef()` function to get a reference to the query.
const ref = listRoadmapItemsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listRoadmapItemsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.roadmapItems);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.roadmapItems);
});
```

## GetScheme
You can execute the `GetScheme` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getScheme(options?: ExecuteQueryOptions): QueryPromise<GetSchemeData, undefined>;

interface GetSchemeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetSchemeData, undefined>;
}
export const getSchemeRef: GetSchemeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getScheme(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetSchemeData, undefined>;

interface GetSchemeRef {
  ...
  (dc: DataConnect): QueryRef<GetSchemeData, undefined>;
}
export const getSchemeRef: GetSchemeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getSchemeRef:
```typescript
const name = getSchemeRef.operationName;
console.log(name);
```

### Variables
The `GetScheme` query has no variables.
### Return Type
Recall that executing the `GetScheme` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetSchemeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetSchemeData {
  scheme?: {
    name: string;
  };
}
```
### Using `GetScheme`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getScheme } from '@dataconnect/generated';


// Call the `getScheme()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getScheme();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getScheme(dataConnect);

console.log(data.scheme);

// Or, you can use the `Promise` API.
getScheme().then((response) => {
  const data = response.data;
  console.log(data.scheme);
});
```

### Using `GetScheme`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getSchemeRef } from '@dataconnect/generated';


// Call the `getSchemeRef()` function to get a reference to the query.
const ref = getSchemeRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getSchemeRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.scheme);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.scheme);
});
```

## ListSchemes
You can execute the `ListSchemes` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listSchemes(options?: ExecuteQueryOptions): QueryPromise<ListSchemesData, undefined>;

interface ListSchemesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListSchemesData, undefined>;
}
export const listSchemesRef: ListSchemesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listSchemes(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListSchemesData, undefined>;

interface ListSchemesRef {
  ...
  (dc: DataConnect): QueryRef<ListSchemesData, undefined>;
}
export const listSchemesRef: ListSchemesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listSchemesRef:
```typescript
const name = listSchemesRef.operationName;
console.log(name);
```

### Variables
The `ListSchemes` query has no variables.
### Return Type
Recall that executing the `ListSchemes` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListSchemesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListSchemesData {
  schemes: ({
    name: string;
  })[];
}
```
### Using `ListSchemes`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listSchemes } from '@dataconnect/generated';


// Call the `listSchemes()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listSchemes();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listSchemes(dataConnect);

console.log(data.schemes);

// Or, you can use the `Promise` API.
listSchemes().then((response) => {
  const data = response.data;
  console.log(data.schemes);
});
```

### Using `ListSchemes`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listSchemesRef } from '@dataconnect/generated';


// Call the `listSchemesRef()` function to get a reference to the query.
const ref = listSchemesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listSchemesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.schemes);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.schemes);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateUser
You can execute the `CreateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUser(): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface CreateUserRef {
  ...
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
}
export const createUserRef: CreateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserRef:
```typescript
const name = createUserRef.operationName;
console.log(name);
```

### Variables
The `CreateUser` mutation has no variables.
### Return Type
Recall that executing the `CreateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserData {
  user_insert: User_Key;
}
```
### Using `CreateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUser } from '@dataconnect/generated';


// Call the `createUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUser(dataConnect);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUser().then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserRef } from '@dataconnect/generated';


// Call the `createUserRef()` function to get a reference to the mutation.
const ref = createUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## UpdateUser
You can execute the `UpdateUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateUser(): MutationPromise<UpdateUserData, undefined>;

interface UpdateUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateUserData, undefined>;
}
export const updateUserRef: UpdateUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateUser(dc: DataConnect): MutationPromise<UpdateUserData, undefined>;

interface UpdateUserRef {
  ...
  (dc: DataConnect): MutationRef<UpdateUserData, undefined>;
}
export const updateUserRef: UpdateUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateUserRef:
```typescript
const name = updateUserRef.operationName;
console.log(name);
```

### Variables
The `UpdateUser` mutation has no variables.
### Return Type
Recall that executing the `UpdateUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateUserData {
  user_update?: User_Key | null;
}
```
### Using `UpdateUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateUser } from '@dataconnect/generated';


// Call the `updateUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateUser(dataConnect);

console.log(data.user_update);

// Or, you can use the `Promise` API.
updateUser().then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

### Using `UpdateUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateUserRef } from '@dataconnect/generated';


// Call the `updateUserRef()` function to get a reference to the mutation.
const ref = updateUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

## DeleteUser
You can execute the `DeleteUser` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteUser(): MutationPromise<DeleteUserData, undefined>;

interface DeleteUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteUserData, undefined>;
}
export const deleteUserRef: DeleteUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteUser(dc: DataConnect): MutationPromise<DeleteUserData, undefined>;

interface DeleteUserRef {
  ...
  (dc: DataConnect): MutationRef<DeleteUserData, undefined>;
}
export const deleteUserRef: DeleteUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteUserRef:
```typescript
const name = deleteUserRef.operationName;
console.log(name);
```

### Variables
The `DeleteUser` mutation has no variables.
### Return Type
Recall that executing the `DeleteUser` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteUserData {
  user_delete?: User_Key | null;
}
```
### Using `DeleteUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteUser } from '@dataconnect/generated';


// Call the `deleteUser()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteUser();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteUser(dataConnect);

console.log(data.user_delete);

// Or, you can use the `Promise` API.
deleteUser().then((response) => {
  const data = response.data;
  console.log(data.user_delete);
});
```

### Using `DeleteUser`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteUserRef } from '@dataconnect/generated';


// Call the `deleteUserRef()` function to get a reference to the mutation.
const ref = deleteUserRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteUserRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_delete);
});
```

## CreateApplication
You can execute the `CreateApplication` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createApplication(): MutationPromise<CreateApplicationData, undefined>;

interface CreateApplicationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateApplicationData, undefined>;
}
export const createApplicationRef: CreateApplicationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createApplication(dc: DataConnect): MutationPromise<CreateApplicationData, undefined>;

interface CreateApplicationRef {
  ...
  (dc: DataConnect): MutationRef<CreateApplicationData, undefined>;
}
export const createApplicationRef: CreateApplicationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createApplicationRef:
```typescript
const name = createApplicationRef.operationName;
console.log(name);
```

### Variables
The `CreateApplication` mutation has no variables.
### Return Type
Recall that executing the `CreateApplication` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateApplicationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateApplicationData {
  application_insert: Application_Key;
}
```
### Using `CreateApplication`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createApplication } from '@dataconnect/generated';


// Call the `createApplication()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createApplication();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createApplication(dataConnect);

console.log(data.application_insert);

// Or, you can use the `Promise` API.
createApplication().then((response) => {
  const data = response.data;
  console.log(data.application_insert);
});
```

### Using `CreateApplication`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createApplicationRef } from '@dataconnect/generated';


// Call the `createApplicationRef()` function to get a reference to the mutation.
const ref = createApplicationRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createApplicationRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.application_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.application_insert);
});
```

## UpdateApplication
You can execute the `UpdateApplication` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateApplication(): MutationPromise<UpdateApplicationData, undefined>;

interface UpdateApplicationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateApplicationData, undefined>;
}
export const updateApplicationRef: UpdateApplicationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateApplication(dc: DataConnect): MutationPromise<UpdateApplicationData, undefined>;

interface UpdateApplicationRef {
  ...
  (dc: DataConnect): MutationRef<UpdateApplicationData, undefined>;
}
export const updateApplicationRef: UpdateApplicationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateApplicationRef:
```typescript
const name = updateApplicationRef.operationName;
console.log(name);
```

### Variables
The `UpdateApplication` mutation has no variables.
### Return Type
Recall that executing the `UpdateApplication` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateApplicationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateApplicationData {
  application_update?: Application_Key | null;
}
```
### Using `UpdateApplication`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateApplication } from '@dataconnect/generated';


// Call the `updateApplication()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateApplication();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateApplication(dataConnect);

console.log(data.application_update);

// Or, you can use the `Promise` API.
updateApplication().then((response) => {
  const data = response.data;
  console.log(data.application_update);
});
```

### Using `UpdateApplication`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateApplicationRef } from '@dataconnect/generated';


// Call the `updateApplicationRef()` function to get a reference to the mutation.
const ref = updateApplicationRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateApplicationRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.application_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.application_update);
});
```

## DeleteApplication
You can execute the `DeleteApplication` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteApplication(): MutationPromise<DeleteApplicationData, undefined>;

interface DeleteApplicationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteApplicationData, undefined>;
}
export const deleteApplicationRef: DeleteApplicationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteApplication(dc: DataConnect): MutationPromise<DeleteApplicationData, undefined>;

interface DeleteApplicationRef {
  ...
  (dc: DataConnect): MutationRef<DeleteApplicationData, undefined>;
}
export const deleteApplicationRef: DeleteApplicationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteApplicationRef:
```typescript
const name = deleteApplicationRef.operationName;
console.log(name);
```

### Variables
The `DeleteApplication` mutation has no variables.
### Return Type
Recall that executing the `DeleteApplication` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteApplicationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteApplicationData {
  application_delete?: Application_Key | null;
}
```
### Using `DeleteApplication`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteApplication } from '@dataconnect/generated';


// Call the `deleteApplication()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteApplication();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteApplication(dataConnect);

console.log(data.application_delete);

// Or, you can use the `Promise` API.
deleteApplication().then((response) => {
  const data = response.data;
  console.log(data.application_delete);
});
```

### Using `DeleteApplication`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteApplicationRef } from '@dataconnect/generated';


// Call the `deleteApplicationRef()` function to get a reference to the mutation.
const ref = deleteApplicationRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteApplicationRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.application_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.application_delete);
});
```

## CreateNotification
You can execute the `CreateNotification` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createNotification(): MutationPromise<CreateNotificationData, undefined>;

interface CreateNotificationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateNotificationData, undefined>;
}
export const createNotificationRef: CreateNotificationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createNotification(dc: DataConnect): MutationPromise<CreateNotificationData, undefined>;

interface CreateNotificationRef {
  ...
  (dc: DataConnect): MutationRef<CreateNotificationData, undefined>;
}
export const createNotificationRef: CreateNotificationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createNotificationRef:
```typescript
const name = createNotificationRef.operationName;
console.log(name);
```

### Variables
The `CreateNotification` mutation has no variables.
### Return Type
Recall that executing the `CreateNotification` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateNotificationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateNotificationData {
  notification_insert: Notification_Key;
}
```
### Using `CreateNotification`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createNotification } from '@dataconnect/generated';


// Call the `createNotification()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createNotification();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createNotification(dataConnect);

console.log(data.notification_insert);

// Or, you can use the `Promise` API.
createNotification().then((response) => {
  const data = response.data;
  console.log(data.notification_insert);
});
```

### Using `CreateNotification`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createNotificationRef } from '@dataconnect/generated';


// Call the `createNotificationRef()` function to get a reference to the mutation.
const ref = createNotificationRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createNotificationRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.notification_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.notification_insert);
});
```

## UpdateNotification
You can execute the `UpdateNotification` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateNotification(): MutationPromise<UpdateNotificationData, undefined>;

interface UpdateNotificationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateNotificationData, undefined>;
}
export const updateNotificationRef: UpdateNotificationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateNotification(dc: DataConnect): MutationPromise<UpdateNotificationData, undefined>;

interface UpdateNotificationRef {
  ...
  (dc: DataConnect): MutationRef<UpdateNotificationData, undefined>;
}
export const updateNotificationRef: UpdateNotificationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateNotificationRef:
```typescript
const name = updateNotificationRef.operationName;
console.log(name);
```

### Variables
The `UpdateNotification` mutation has no variables.
### Return Type
Recall that executing the `UpdateNotification` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateNotificationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateNotificationData {
  notification_update?: Notification_Key | null;
}
```
### Using `UpdateNotification`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateNotification } from '@dataconnect/generated';


// Call the `updateNotification()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateNotification();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateNotification(dataConnect);

console.log(data.notification_update);

// Or, you can use the `Promise` API.
updateNotification().then((response) => {
  const data = response.data;
  console.log(data.notification_update);
});
```

### Using `UpdateNotification`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateNotificationRef } from '@dataconnect/generated';


// Call the `updateNotificationRef()` function to get a reference to the mutation.
const ref = updateNotificationRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateNotificationRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.notification_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.notification_update);
});
```

## DeleteNotification
You can execute the `DeleteNotification` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteNotification(): MutationPromise<DeleteNotificationData, undefined>;

interface DeleteNotificationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteNotificationData, undefined>;
}
export const deleteNotificationRef: DeleteNotificationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteNotification(dc: DataConnect): MutationPromise<DeleteNotificationData, undefined>;

interface DeleteNotificationRef {
  ...
  (dc: DataConnect): MutationRef<DeleteNotificationData, undefined>;
}
export const deleteNotificationRef: DeleteNotificationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteNotificationRef:
```typescript
const name = deleteNotificationRef.operationName;
console.log(name);
```

### Variables
The `DeleteNotification` mutation has no variables.
### Return Type
Recall that executing the `DeleteNotification` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteNotificationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteNotificationData {
  notification_delete?: Notification_Key | null;
}
```
### Using `DeleteNotification`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteNotification } from '@dataconnect/generated';


// Call the `deleteNotification()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteNotification();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteNotification(dataConnect);

console.log(data.notification_delete);

// Or, you can use the `Promise` API.
deleteNotification().then((response) => {
  const data = response.data;
  console.log(data.notification_delete);
});
```

### Using `DeleteNotification`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteNotificationRef } from '@dataconnect/generated';


// Call the `deleteNotificationRef()` function to get a reference to the mutation.
const ref = deleteNotificationRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteNotificationRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.notification_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.notification_delete);
});
```

## CreatePolicy
You can execute the `CreatePolicy` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createPolicy(): MutationPromise<CreatePolicyData, undefined>;

interface CreatePolicyRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreatePolicyData, undefined>;
}
export const createPolicyRef: CreatePolicyRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createPolicy(dc: DataConnect): MutationPromise<CreatePolicyData, undefined>;

interface CreatePolicyRef {
  ...
  (dc: DataConnect): MutationRef<CreatePolicyData, undefined>;
}
export const createPolicyRef: CreatePolicyRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createPolicyRef:
```typescript
const name = createPolicyRef.operationName;
console.log(name);
```

### Variables
The `CreatePolicy` mutation has no variables.
### Return Type
Recall that executing the `CreatePolicy` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreatePolicyData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreatePolicyData {
  policy_insert: Policy_Key;
}
```
### Using `CreatePolicy`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createPolicy } from '@dataconnect/generated';


// Call the `createPolicy()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createPolicy();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createPolicy(dataConnect);

console.log(data.policy_insert);

// Or, you can use the `Promise` API.
createPolicy().then((response) => {
  const data = response.data;
  console.log(data.policy_insert);
});
```

### Using `CreatePolicy`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createPolicyRef } from '@dataconnect/generated';


// Call the `createPolicyRef()` function to get a reference to the mutation.
const ref = createPolicyRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createPolicyRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.policy_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.policy_insert);
});
```

## UpdatePolicy
You can execute the `UpdatePolicy` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updatePolicy(): MutationPromise<UpdatePolicyData, undefined>;

interface UpdatePolicyRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdatePolicyData, undefined>;
}
export const updatePolicyRef: UpdatePolicyRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updatePolicy(dc: DataConnect): MutationPromise<UpdatePolicyData, undefined>;

interface UpdatePolicyRef {
  ...
  (dc: DataConnect): MutationRef<UpdatePolicyData, undefined>;
}
export const updatePolicyRef: UpdatePolicyRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updatePolicyRef:
```typescript
const name = updatePolicyRef.operationName;
console.log(name);
```

### Variables
The `UpdatePolicy` mutation has no variables.
### Return Type
Recall that executing the `UpdatePolicy` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdatePolicyData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdatePolicyData {
  policy_update?: Policy_Key | null;
}
```
### Using `UpdatePolicy`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updatePolicy } from '@dataconnect/generated';


// Call the `updatePolicy()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updatePolicy();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updatePolicy(dataConnect);

console.log(data.policy_update);

// Or, you can use the `Promise` API.
updatePolicy().then((response) => {
  const data = response.data;
  console.log(data.policy_update);
});
```

### Using `UpdatePolicy`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updatePolicyRef } from '@dataconnect/generated';


// Call the `updatePolicyRef()` function to get a reference to the mutation.
const ref = updatePolicyRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updatePolicyRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.policy_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.policy_update);
});
```

## DeletePolicy
You can execute the `DeletePolicy` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deletePolicy(): MutationPromise<DeletePolicyData, undefined>;

interface DeletePolicyRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeletePolicyData, undefined>;
}
export const deletePolicyRef: DeletePolicyRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deletePolicy(dc: DataConnect): MutationPromise<DeletePolicyData, undefined>;

interface DeletePolicyRef {
  ...
  (dc: DataConnect): MutationRef<DeletePolicyData, undefined>;
}
export const deletePolicyRef: DeletePolicyRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deletePolicyRef:
```typescript
const name = deletePolicyRef.operationName;
console.log(name);
```

### Variables
The `DeletePolicy` mutation has no variables.
### Return Type
Recall that executing the `DeletePolicy` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeletePolicyData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeletePolicyData {
  policy_delete?: Policy_Key | null;
}
```
### Using `DeletePolicy`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deletePolicy } from '@dataconnect/generated';


// Call the `deletePolicy()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deletePolicy();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deletePolicy(dataConnect);

console.log(data.policy_delete);

// Or, you can use the `Promise` API.
deletePolicy().then((response) => {
  const data = response.data;
  console.log(data.policy_delete);
});
```

### Using `DeletePolicy`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deletePolicyRef } from '@dataconnect/generated';


// Call the `deletePolicyRef()` function to get a reference to the mutation.
const ref = deletePolicyRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deletePolicyRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.policy_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.policy_delete);
});
```

## CreateRoadmapItem
You can execute the `CreateRoadmapItem` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createRoadmapItem(): MutationPromise<CreateRoadmapItemData, undefined>;

interface CreateRoadmapItemRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateRoadmapItemData, undefined>;
}
export const createRoadmapItemRef: CreateRoadmapItemRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createRoadmapItem(dc: DataConnect): MutationPromise<CreateRoadmapItemData, undefined>;

interface CreateRoadmapItemRef {
  ...
  (dc: DataConnect): MutationRef<CreateRoadmapItemData, undefined>;
}
export const createRoadmapItemRef: CreateRoadmapItemRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createRoadmapItemRef:
```typescript
const name = createRoadmapItemRef.operationName;
console.log(name);
```

### Variables
The `CreateRoadmapItem` mutation has no variables.
### Return Type
Recall that executing the `CreateRoadmapItem` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateRoadmapItemData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateRoadmapItemData {
  roadmapItem_insert: RoadmapItem_Key;
}
```
### Using `CreateRoadmapItem`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createRoadmapItem } from '@dataconnect/generated';


// Call the `createRoadmapItem()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createRoadmapItem();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createRoadmapItem(dataConnect);

console.log(data.roadmapItem_insert);

// Or, you can use the `Promise` API.
createRoadmapItem().then((response) => {
  const data = response.data;
  console.log(data.roadmapItem_insert);
});
```

### Using `CreateRoadmapItem`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createRoadmapItemRef } from '@dataconnect/generated';


// Call the `createRoadmapItemRef()` function to get a reference to the mutation.
const ref = createRoadmapItemRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createRoadmapItemRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.roadmapItem_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.roadmapItem_insert);
});
```

## UpdateRoadmapItem
You can execute the `UpdateRoadmapItem` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateRoadmapItem(): MutationPromise<UpdateRoadmapItemData, undefined>;

interface UpdateRoadmapItemRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateRoadmapItemData, undefined>;
}
export const updateRoadmapItemRef: UpdateRoadmapItemRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateRoadmapItem(dc: DataConnect): MutationPromise<UpdateRoadmapItemData, undefined>;

interface UpdateRoadmapItemRef {
  ...
  (dc: DataConnect): MutationRef<UpdateRoadmapItemData, undefined>;
}
export const updateRoadmapItemRef: UpdateRoadmapItemRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateRoadmapItemRef:
```typescript
const name = updateRoadmapItemRef.operationName;
console.log(name);
```

### Variables
The `UpdateRoadmapItem` mutation has no variables.
### Return Type
Recall that executing the `UpdateRoadmapItem` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateRoadmapItemData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateRoadmapItemData {
  roadmapItem_update?: RoadmapItem_Key | null;
}
```
### Using `UpdateRoadmapItem`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateRoadmapItem } from '@dataconnect/generated';


// Call the `updateRoadmapItem()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateRoadmapItem();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateRoadmapItem(dataConnect);

console.log(data.roadmapItem_update);

// Or, you can use the `Promise` API.
updateRoadmapItem().then((response) => {
  const data = response.data;
  console.log(data.roadmapItem_update);
});
```

### Using `UpdateRoadmapItem`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateRoadmapItemRef } from '@dataconnect/generated';


// Call the `updateRoadmapItemRef()` function to get a reference to the mutation.
const ref = updateRoadmapItemRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateRoadmapItemRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.roadmapItem_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.roadmapItem_update);
});
```

## DeleteRoadmapItem
You can execute the `DeleteRoadmapItem` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteRoadmapItem(): MutationPromise<DeleteRoadmapItemData, undefined>;

interface DeleteRoadmapItemRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteRoadmapItemData, undefined>;
}
export const deleteRoadmapItemRef: DeleteRoadmapItemRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteRoadmapItem(dc: DataConnect): MutationPromise<DeleteRoadmapItemData, undefined>;

interface DeleteRoadmapItemRef {
  ...
  (dc: DataConnect): MutationRef<DeleteRoadmapItemData, undefined>;
}
export const deleteRoadmapItemRef: DeleteRoadmapItemRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteRoadmapItemRef:
```typescript
const name = deleteRoadmapItemRef.operationName;
console.log(name);
```

### Variables
The `DeleteRoadmapItem` mutation has no variables.
### Return Type
Recall that executing the `DeleteRoadmapItem` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteRoadmapItemData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteRoadmapItemData {
  roadmapItem_delete?: RoadmapItem_Key | null;
}
```
### Using `DeleteRoadmapItem`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteRoadmapItem } from '@dataconnect/generated';


// Call the `deleteRoadmapItem()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteRoadmapItem();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteRoadmapItem(dataConnect);

console.log(data.roadmapItem_delete);

// Or, you can use the `Promise` API.
deleteRoadmapItem().then((response) => {
  const data = response.data;
  console.log(data.roadmapItem_delete);
});
```

### Using `DeleteRoadmapItem`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteRoadmapItemRef } from '@dataconnect/generated';


// Call the `deleteRoadmapItemRef()` function to get a reference to the mutation.
const ref = deleteRoadmapItemRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteRoadmapItemRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.roadmapItem_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.roadmapItem_delete);
});
```

## CreateScheme
You can execute the `CreateScheme` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createScheme(): MutationPromise<CreateSchemeData, undefined>;

interface CreateSchemeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateSchemeData, undefined>;
}
export const createSchemeRef: CreateSchemeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createScheme(dc: DataConnect): MutationPromise<CreateSchemeData, undefined>;

interface CreateSchemeRef {
  ...
  (dc: DataConnect): MutationRef<CreateSchemeData, undefined>;
}
export const createSchemeRef: CreateSchemeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createSchemeRef:
```typescript
const name = createSchemeRef.operationName;
console.log(name);
```

### Variables
The `CreateScheme` mutation has no variables.
### Return Type
Recall that executing the `CreateScheme` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateSchemeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateSchemeData {
  scheme_insert: Scheme_Key;
}
```
### Using `CreateScheme`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createScheme } from '@dataconnect/generated';


// Call the `createScheme()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createScheme();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createScheme(dataConnect);

console.log(data.scheme_insert);

// Or, you can use the `Promise` API.
createScheme().then((response) => {
  const data = response.data;
  console.log(data.scheme_insert);
});
```

### Using `CreateScheme`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createSchemeRef } from '@dataconnect/generated';


// Call the `createSchemeRef()` function to get a reference to the mutation.
const ref = createSchemeRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createSchemeRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.scheme_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.scheme_insert);
});
```

## UpdateScheme
You can execute the `UpdateScheme` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateScheme(): MutationPromise<UpdateSchemeData, undefined>;

interface UpdateSchemeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateSchemeData, undefined>;
}
export const updateSchemeRef: UpdateSchemeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateScheme(dc: DataConnect): MutationPromise<UpdateSchemeData, undefined>;

interface UpdateSchemeRef {
  ...
  (dc: DataConnect): MutationRef<UpdateSchemeData, undefined>;
}
export const updateSchemeRef: UpdateSchemeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateSchemeRef:
```typescript
const name = updateSchemeRef.operationName;
console.log(name);
```

### Variables
The `UpdateScheme` mutation has no variables.
### Return Type
Recall that executing the `UpdateScheme` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateSchemeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateSchemeData {
  scheme_update?: Scheme_Key | null;
}
```
### Using `UpdateScheme`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateScheme } from '@dataconnect/generated';


// Call the `updateScheme()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateScheme();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateScheme(dataConnect);

console.log(data.scheme_update);

// Or, you can use the `Promise` API.
updateScheme().then((response) => {
  const data = response.data;
  console.log(data.scheme_update);
});
```

### Using `UpdateScheme`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateSchemeRef } from '@dataconnect/generated';


// Call the `updateSchemeRef()` function to get a reference to the mutation.
const ref = updateSchemeRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateSchemeRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.scheme_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.scheme_update);
});
```

## DeleteScheme
You can execute the `DeleteScheme` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteScheme(): MutationPromise<DeleteSchemeData, undefined>;

interface DeleteSchemeRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteSchemeData, undefined>;
}
export const deleteSchemeRef: DeleteSchemeRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteScheme(dc: DataConnect): MutationPromise<DeleteSchemeData, undefined>;

interface DeleteSchemeRef {
  ...
  (dc: DataConnect): MutationRef<DeleteSchemeData, undefined>;
}
export const deleteSchemeRef: DeleteSchemeRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteSchemeRef:
```typescript
const name = deleteSchemeRef.operationName;
console.log(name);
```

### Variables
The `DeleteScheme` mutation has no variables.
### Return Type
Recall that executing the `DeleteScheme` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteSchemeData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteSchemeData {
  scheme_delete?: Scheme_Key | null;
}
```
### Using `DeleteScheme`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteScheme } from '@dataconnect/generated';


// Call the `deleteScheme()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteScheme();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteScheme(dataConnect);

console.log(data.scheme_delete);

// Or, you can use the `Promise` API.
deleteScheme().then((response) => {
  const data = response.data;
  console.log(data.scheme_delete);
});
```

### Using `DeleteScheme`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteSchemeRef } from '@dataconnect/generated';


// Call the `deleteSchemeRef()` function to get a reference to the mutation.
const ref = deleteSchemeRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteSchemeRef(dataConnect);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.scheme_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.scheme_delete);
});
```

