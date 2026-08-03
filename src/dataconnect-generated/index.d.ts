import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Application_Key {
  id: UUIDString;
  __typename?: 'Application_Key';
}

export interface CreateApplicationData {
  application_insert: Application_Key;
}

export interface CreateNotificationData {
  notification_insert: Notification_Key;
}

export interface CreatePolicyData {
  policy_insert: Policy_Key;
}

export interface CreateRoadmapItemData {
  roadmapItem_insert: RoadmapItem_Key;
}

export interface CreateSchemeData {
  scheme_insert: Scheme_Key;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface DeleteApplicationData {
  application_delete?: Application_Key | null;
}

export interface DeleteNotificationData {
  notification_delete?: Notification_Key | null;
}

export interface DeletePolicyData {
  policy_delete?: Policy_Key | null;
}

export interface DeleteRoadmapItemData {
  roadmapItem_delete?: RoadmapItem_Key | null;
}

export interface DeleteSchemeData {
  scheme_delete?: Scheme_Key | null;
}

export interface DeleteUserData {
  user_delete?: User_Key | null;
}

export interface GetApplicationData {
  application?: {
    status: string;
    scheme: {
      name: string;
    };
  };
}

export interface GetNotificationData {
  notification?: {
    message: string;
  };
}

export interface GetPolicyData {
  policy?: {
    title: string;
  };
}

export interface GetRoadmapItemData {
  roadmapItem?: {
    title: string;
  };
}

export interface GetSchemeData {
  scheme?: {
    name: string;
  };
}

export interface GetUserData {
  user?: {
    email: string;
    riskScore: number;
  };
}

export interface ListApplicationsData {
  applications: ({
    id: UUIDString;
    status: string;
  } & Application_Key)[];
}

export interface ListNotificationsData {
  notifications: ({
    message: string;
  })[];
}

export interface ListPoliciesData {
  policies: ({
    title: string;
  })[];
}

export interface ListRoadmapItemsData {
  roadmapItems: ({
    title: string;
    status: string;
  })[];
}

export interface ListSchemesData {
  schemes: ({
    name: string;
  })[];
}

export interface ListUsersData {
  users: ({
    id: UUIDString;
    email: string;
  } & User_Key)[];
}

export interface Notification_Key {
  id: UUIDString;
  __typename?: 'Notification_Key';
}

export interface Policy_Key {
  id: UUIDString;
  __typename?: 'Policy_Key';
}

export interface RoadmapItem_Key {
  id: UUIDString;
  __typename?: 'RoadmapItem_Key';
}

export interface Scheme_Key {
  id: UUIDString;
  __typename?: 'Scheme_Key';
}

export interface UpdateApplicationData {
  application_update?: Application_Key | null;
}

export interface UpdateNotificationData {
  notification_update?: Notification_Key | null;
}

export interface UpdatePolicyData {
  policy_update?: Policy_Key | null;
}

export interface UpdateRoadmapItemData {
  roadmapItem_update?: RoadmapItem_Key | null;
}

export interface UpdateSchemeData {
  scheme_update?: Scheme_Key | null;
}

export interface UpdateUserData {
  user_update?: User_Key | null;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateUserData, undefined>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(): MutationPromise<CreateUserData, undefined>;
export function createUser(dc: DataConnect): MutationPromise<CreateUserData, undefined>;

interface UpdateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<UpdateUserData, undefined>;
  operationName: string;
}
export const updateUserRef: UpdateUserRef;

export function updateUser(): MutationPromise<UpdateUserData, undefined>;
export function updateUser(dc: DataConnect): MutationPromise<UpdateUserData, undefined>;

interface DeleteUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteUserData, undefined>;
  operationName: string;
}
export const deleteUserRef: DeleteUserRef;

export function deleteUser(): MutationPromise<DeleteUserData, undefined>;
export function deleteUser(dc: DataConnect): MutationPromise<DeleteUserData, undefined>;

interface GetUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserData, undefined>;
  operationName: string;
}
export const getUserRef: GetUserRef;

export function getUser(options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;
export function getUser(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetUserData, undefined>;

interface ListUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListUsersData, undefined>;
  operationName: string;
}
export const listUsersRef: ListUsersRef;

export function listUsers(options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;
export function listUsers(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListUsersData, undefined>;

interface CreateApplicationRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateApplicationData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateApplicationData, undefined>;
  operationName: string;
}
export const createApplicationRef: CreateApplicationRef;

export function createApplication(): MutationPromise<CreateApplicationData, undefined>;
export function createApplication(dc: DataConnect): MutationPromise<CreateApplicationData, undefined>;

interface UpdateApplicationRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateApplicationData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<UpdateApplicationData, undefined>;
  operationName: string;
}
export const updateApplicationRef: UpdateApplicationRef;

export function updateApplication(): MutationPromise<UpdateApplicationData, undefined>;
export function updateApplication(dc: DataConnect): MutationPromise<UpdateApplicationData, undefined>;

interface DeleteApplicationRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteApplicationData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteApplicationData, undefined>;
  operationName: string;
}
export const deleteApplicationRef: DeleteApplicationRef;

export function deleteApplication(): MutationPromise<DeleteApplicationData, undefined>;
export function deleteApplication(dc: DataConnect): MutationPromise<DeleteApplicationData, undefined>;

interface GetApplicationRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetApplicationData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetApplicationData, undefined>;
  operationName: string;
}
export const getApplicationRef: GetApplicationRef;

export function getApplication(options?: ExecuteQueryOptions): QueryPromise<GetApplicationData, undefined>;
export function getApplication(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetApplicationData, undefined>;

interface ListApplicationsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListApplicationsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListApplicationsData, undefined>;
  operationName: string;
}
export const listApplicationsRef: ListApplicationsRef;

export function listApplications(options?: ExecuteQueryOptions): QueryPromise<ListApplicationsData, undefined>;
export function listApplications(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListApplicationsData, undefined>;

interface CreateNotificationRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateNotificationData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateNotificationData, undefined>;
  operationName: string;
}
export const createNotificationRef: CreateNotificationRef;

export function createNotification(): MutationPromise<CreateNotificationData, undefined>;
export function createNotification(dc: DataConnect): MutationPromise<CreateNotificationData, undefined>;

interface UpdateNotificationRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateNotificationData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<UpdateNotificationData, undefined>;
  operationName: string;
}
export const updateNotificationRef: UpdateNotificationRef;

export function updateNotification(): MutationPromise<UpdateNotificationData, undefined>;
export function updateNotification(dc: DataConnect): MutationPromise<UpdateNotificationData, undefined>;

interface DeleteNotificationRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteNotificationData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteNotificationData, undefined>;
  operationName: string;
}
export const deleteNotificationRef: DeleteNotificationRef;

export function deleteNotification(): MutationPromise<DeleteNotificationData, undefined>;
export function deleteNotification(dc: DataConnect): MutationPromise<DeleteNotificationData, undefined>;

interface GetNotificationRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetNotificationData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetNotificationData, undefined>;
  operationName: string;
}
export const getNotificationRef: GetNotificationRef;

export function getNotification(options?: ExecuteQueryOptions): QueryPromise<GetNotificationData, undefined>;
export function getNotification(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetNotificationData, undefined>;

interface ListNotificationsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListNotificationsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListNotificationsData, undefined>;
  operationName: string;
}
export const listNotificationsRef: ListNotificationsRef;

export function listNotifications(options?: ExecuteQueryOptions): QueryPromise<ListNotificationsData, undefined>;
export function listNotifications(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListNotificationsData, undefined>;

interface CreatePolicyRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreatePolicyData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreatePolicyData, undefined>;
  operationName: string;
}
export const createPolicyRef: CreatePolicyRef;

export function createPolicy(): MutationPromise<CreatePolicyData, undefined>;
export function createPolicy(dc: DataConnect): MutationPromise<CreatePolicyData, undefined>;

interface UpdatePolicyRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdatePolicyData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<UpdatePolicyData, undefined>;
  operationName: string;
}
export const updatePolicyRef: UpdatePolicyRef;

export function updatePolicy(): MutationPromise<UpdatePolicyData, undefined>;
export function updatePolicy(dc: DataConnect): MutationPromise<UpdatePolicyData, undefined>;

interface DeletePolicyRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeletePolicyData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeletePolicyData, undefined>;
  operationName: string;
}
export const deletePolicyRef: DeletePolicyRef;

export function deletePolicy(): MutationPromise<DeletePolicyData, undefined>;
export function deletePolicy(dc: DataConnect): MutationPromise<DeletePolicyData, undefined>;

interface GetPolicyRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPolicyData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetPolicyData, undefined>;
  operationName: string;
}
export const getPolicyRef: GetPolicyRef;

export function getPolicy(options?: ExecuteQueryOptions): QueryPromise<GetPolicyData, undefined>;
export function getPolicy(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetPolicyData, undefined>;

interface ListPoliciesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPoliciesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPoliciesData, undefined>;
  operationName: string;
}
export const listPoliciesRef: ListPoliciesRef;

export function listPolicies(options?: ExecuteQueryOptions): QueryPromise<ListPoliciesData, undefined>;
export function listPolicies(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPoliciesData, undefined>;

interface CreateRoadmapItemRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateRoadmapItemData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateRoadmapItemData, undefined>;
  operationName: string;
}
export const createRoadmapItemRef: CreateRoadmapItemRef;

export function createRoadmapItem(): MutationPromise<CreateRoadmapItemData, undefined>;
export function createRoadmapItem(dc: DataConnect): MutationPromise<CreateRoadmapItemData, undefined>;

interface UpdateRoadmapItemRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateRoadmapItemData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<UpdateRoadmapItemData, undefined>;
  operationName: string;
}
export const updateRoadmapItemRef: UpdateRoadmapItemRef;

export function updateRoadmapItem(): MutationPromise<UpdateRoadmapItemData, undefined>;
export function updateRoadmapItem(dc: DataConnect): MutationPromise<UpdateRoadmapItemData, undefined>;

interface DeleteRoadmapItemRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteRoadmapItemData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteRoadmapItemData, undefined>;
  operationName: string;
}
export const deleteRoadmapItemRef: DeleteRoadmapItemRef;

export function deleteRoadmapItem(): MutationPromise<DeleteRoadmapItemData, undefined>;
export function deleteRoadmapItem(dc: DataConnect): MutationPromise<DeleteRoadmapItemData, undefined>;

interface GetRoadmapItemRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetRoadmapItemData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetRoadmapItemData, undefined>;
  operationName: string;
}
export const getRoadmapItemRef: GetRoadmapItemRef;

export function getRoadmapItem(options?: ExecuteQueryOptions): QueryPromise<GetRoadmapItemData, undefined>;
export function getRoadmapItem(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetRoadmapItemData, undefined>;

interface ListRoadmapItemsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListRoadmapItemsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListRoadmapItemsData, undefined>;
  operationName: string;
}
export const listRoadmapItemsRef: ListRoadmapItemsRef;

export function listRoadmapItems(options?: ExecuteQueryOptions): QueryPromise<ListRoadmapItemsData, undefined>;
export function listRoadmapItems(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListRoadmapItemsData, undefined>;

interface CreateSchemeRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateSchemeData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateSchemeData, undefined>;
  operationName: string;
}
export const createSchemeRef: CreateSchemeRef;

export function createScheme(): MutationPromise<CreateSchemeData, undefined>;
export function createScheme(dc: DataConnect): MutationPromise<CreateSchemeData, undefined>;

interface UpdateSchemeRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<UpdateSchemeData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<UpdateSchemeData, undefined>;
  operationName: string;
}
export const updateSchemeRef: UpdateSchemeRef;

export function updateScheme(): MutationPromise<UpdateSchemeData, undefined>;
export function updateScheme(dc: DataConnect): MutationPromise<UpdateSchemeData, undefined>;

interface DeleteSchemeRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<DeleteSchemeData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<DeleteSchemeData, undefined>;
  operationName: string;
}
export const deleteSchemeRef: DeleteSchemeRef;

export function deleteScheme(): MutationPromise<DeleteSchemeData, undefined>;
export function deleteScheme(dc: DataConnect): MutationPromise<DeleteSchemeData, undefined>;

interface GetSchemeRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetSchemeData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetSchemeData, undefined>;
  operationName: string;
}
export const getSchemeRef: GetSchemeRef;

export function getScheme(options?: ExecuteQueryOptions): QueryPromise<GetSchemeData, undefined>;
export function getScheme(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetSchemeData, undefined>;

interface ListSchemesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListSchemesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListSchemesData, undefined>;
  operationName: string;
}
export const listSchemesRef: ListSchemesRef;

export function listSchemes(options?: ExecuteQueryOptions): QueryPromise<ListSchemesData, undefined>;
export function listSchemes(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListSchemesData, undefined>;

