import { CreateUserData, UpdateUserData, DeleteUserData, GetUserData, ListUsersData, CreateApplicationData, UpdateApplicationData, DeleteApplicationData, GetApplicationData, ListApplicationsData, CreateNotificationData, UpdateNotificationData, DeleteNotificationData, GetNotificationData, ListNotificationsData, CreatePolicyData, UpdatePolicyData, DeletePolicyData, GetPolicyData, ListPoliciesData, CreateRoadmapItemData, UpdateRoadmapItemData, DeleteRoadmapItemData, GetRoadmapItemData, ListRoadmapItemsData, CreateSchemeData, UpdateSchemeData, DeleteSchemeData, GetSchemeData, ListSchemesData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateUser(options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;
export function useCreateUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateUserData, undefined>;

export function useUpdateUser(options?: useDataConnectMutationOptions<UpdateUserData, FirebaseError, void>): UseDataConnectMutationResult<UpdateUserData, undefined>;
export function useUpdateUser(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateUserData, FirebaseError, void>): UseDataConnectMutationResult<UpdateUserData, undefined>;

export function useDeleteUser(options?: useDataConnectMutationOptions<DeleteUserData, FirebaseError, void>): UseDataConnectMutationResult<DeleteUserData, undefined>;
export function useDeleteUser(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteUserData, FirebaseError, void>): UseDataConnectMutationResult<DeleteUserData, undefined>;

export function useGetUser(options?: useDataConnectQueryOptions<GetUserData>): UseDataConnectQueryResult<GetUserData, undefined>;
export function useGetUser(dc: DataConnect, options?: useDataConnectQueryOptions<GetUserData>): UseDataConnectQueryResult<GetUserData, undefined>;

export function useListUsers(options?: useDataConnectQueryOptions<ListUsersData>): UseDataConnectQueryResult<ListUsersData, undefined>;
export function useListUsers(dc: DataConnect, options?: useDataConnectQueryOptions<ListUsersData>): UseDataConnectQueryResult<ListUsersData, undefined>;

export function useCreateApplication(options?: useDataConnectMutationOptions<CreateApplicationData, FirebaseError, void>): UseDataConnectMutationResult<CreateApplicationData, undefined>;
export function useCreateApplication(dc: DataConnect, options?: useDataConnectMutationOptions<CreateApplicationData, FirebaseError, void>): UseDataConnectMutationResult<CreateApplicationData, undefined>;

export function useUpdateApplication(options?: useDataConnectMutationOptions<UpdateApplicationData, FirebaseError, void>): UseDataConnectMutationResult<UpdateApplicationData, undefined>;
export function useUpdateApplication(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateApplicationData, FirebaseError, void>): UseDataConnectMutationResult<UpdateApplicationData, undefined>;

export function useDeleteApplication(options?: useDataConnectMutationOptions<DeleteApplicationData, FirebaseError, void>): UseDataConnectMutationResult<DeleteApplicationData, undefined>;
export function useDeleteApplication(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteApplicationData, FirebaseError, void>): UseDataConnectMutationResult<DeleteApplicationData, undefined>;

export function useGetApplication(options?: useDataConnectQueryOptions<GetApplicationData>): UseDataConnectQueryResult<GetApplicationData, undefined>;
export function useGetApplication(dc: DataConnect, options?: useDataConnectQueryOptions<GetApplicationData>): UseDataConnectQueryResult<GetApplicationData, undefined>;

export function useListApplications(options?: useDataConnectQueryOptions<ListApplicationsData>): UseDataConnectQueryResult<ListApplicationsData, undefined>;
export function useListApplications(dc: DataConnect, options?: useDataConnectQueryOptions<ListApplicationsData>): UseDataConnectQueryResult<ListApplicationsData, undefined>;

export function useCreateNotification(options?: useDataConnectMutationOptions<CreateNotificationData, FirebaseError, void>): UseDataConnectMutationResult<CreateNotificationData, undefined>;
export function useCreateNotification(dc: DataConnect, options?: useDataConnectMutationOptions<CreateNotificationData, FirebaseError, void>): UseDataConnectMutationResult<CreateNotificationData, undefined>;

export function useUpdateNotification(options?: useDataConnectMutationOptions<UpdateNotificationData, FirebaseError, void>): UseDataConnectMutationResult<UpdateNotificationData, undefined>;
export function useUpdateNotification(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateNotificationData, FirebaseError, void>): UseDataConnectMutationResult<UpdateNotificationData, undefined>;

export function useDeleteNotification(options?: useDataConnectMutationOptions<DeleteNotificationData, FirebaseError, void>): UseDataConnectMutationResult<DeleteNotificationData, undefined>;
export function useDeleteNotification(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteNotificationData, FirebaseError, void>): UseDataConnectMutationResult<DeleteNotificationData, undefined>;

export function useGetNotification(options?: useDataConnectQueryOptions<GetNotificationData>): UseDataConnectQueryResult<GetNotificationData, undefined>;
export function useGetNotification(dc: DataConnect, options?: useDataConnectQueryOptions<GetNotificationData>): UseDataConnectQueryResult<GetNotificationData, undefined>;

export function useListNotifications(options?: useDataConnectQueryOptions<ListNotificationsData>): UseDataConnectQueryResult<ListNotificationsData, undefined>;
export function useListNotifications(dc: DataConnect, options?: useDataConnectQueryOptions<ListNotificationsData>): UseDataConnectQueryResult<ListNotificationsData, undefined>;

export function useCreatePolicy(options?: useDataConnectMutationOptions<CreatePolicyData, FirebaseError, void>): UseDataConnectMutationResult<CreatePolicyData, undefined>;
export function useCreatePolicy(dc: DataConnect, options?: useDataConnectMutationOptions<CreatePolicyData, FirebaseError, void>): UseDataConnectMutationResult<CreatePolicyData, undefined>;

export function useUpdatePolicy(options?: useDataConnectMutationOptions<UpdatePolicyData, FirebaseError, void>): UseDataConnectMutationResult<UpdatePolicyData, undefined>;
export function useUpdatePolicy(dc: DataConnect, options?: useDataConnectMutationOptions<UpdatePolicyData, FirebaseError, void>): UseDataConnectMutationResult<UpdatePolicyData, undefined>;

export function useDeletePolicy(options?: useDataConnectMutationOptions<DeletePolicyData, FirebaseError, void>): UseDataConnectMutationResult<DeletePolicyData, undefined>;
export function useDeletePolicy(dc: DataConnect, options?: useDataConnectMutationOptions<DeletePolicyData, FirebaseError, void>): UseDataConnectMutationResult<DeletePolicyData, undefined>;

export function useGetPolicy(options?: useDataConnectQueryOptions<GetPolicyData>): UseDataConnectQueryResult<GetPolicyData, undefined>;
export function useGetPolicy(dc: DataConnect, options?: useDataConnectQueryOptions<GetPolicyData>): UseDataConnectQueryResult<GetPolicyData, undefined>;

export function useListPolicies(options?: useDataConnectQueryOptions<ListPoliciesData>): UseDataConnectQueryResult<ListPoliciesData, undefined>;
export function useListPolicies(dc: DataConnect, options?: useDataConnectQueryOptions<ListPoliciesData>): UseDataConnectQueryResult<ListPoliciesData, undefined>;

export function useCreateRoadmapItem(options?: useDataConnectMutationOptions<CreateRoadmapItemData, FirebaseError, void>): UseDataConnectMutationResult<CreateRoadmapItemData, undefined>;
export function useCreateRoadmapItem(dc: DataConnect, options?: useDataConnectMutationOptions<CreateRoadmapItemData, FirebaseError, void>): UseDataConnectMutationResult<CreateRoadmapItemData, undefined>;

export function useUpdateRoadmapItem(options?: useDataConnectMutationOptions<UpdateRoadmapItemData, FirebaseError, void>): UseDataConnectMutationResult<UpdateRoadmapItemData, undefined>;
export function useUpdateRoadmapItem(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateRoadmapItemData, FirebaseError, void>): UseDataConnectMutationResult<UpdateRoadmapItemData, undefined>;

export function useDeleteRoadmapItem(options?: useDataConnectMutationOptions<DeleteRoadmapItemData, FirebaseError, void>): UseDataConnectMutationResult<DeleteRoadmapItemData, undefined>;
export function useDeleteRoadmapItem(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteRoadmapItemData, FirebaseError, void>): UseDataConnectMutationResult<DeleteRoadmapItemData, undefined>;

export function useGetRoadmapItem(options?: useDataConnectQueryOptions<GetRoadmapItemData>): UseDataConnectQueryResult<GetRoadmapItemData, undefined>;
export function useGetRoadmapItem(dc: DataConnect, options?: useDataConnectQueryOptions<GetRoadmapItemData>): UseDataConnectQueryResult<GetRoadmapItemData, undefined>;

export function useListRoadmapItems(options?: useDataConnectQueryOptions<ListRoadmapItemsData>): UseDataConnectQueryResult<ListRoadmapItemsData, undefined>;
export function useListRoadmapItems(dc: DataConnect, options?: useDataConnectQueryOptions<ListRoadmapItemsData>): UseDataConnectQueryResult<ListRoadmapItemsData, undefined>;

export function useCreateScheme(options?: useDataConnectMutationOptions<CreateSchemeData, FirebaseError, void>): UseDataConnectMutationResult<CreateSchemeData, undefined>;
export function useCreateScheme(dc: DataConnect, options?: useDataConnectMutationOptions<CreateSchemeData, FirebaseError, void>): UseDataConnectMutationResult<CreateSchemeData, undefined>;

export function useUpdateScheme(options?: useDataConnectMutationOptions<UpdateSchemeData, FirebaseError, void>): UseDataConnectMutationResult<UpdateSchemeData, undefined>;
export function useUpdateScheme(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateSchemeData, FirebaseError, void>): UseDataConnectMutationResult<UpdateSchemeData, undefined>;

export function useDeleteScheme(options?: useDataConnectMutationOptions<DeleteSchemeData, FirebaseError, void>): UseDataConnectMutationResult<DeleteSchemeData, undefined>;
export function useDeleteScheme(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteSchemeData, FirebaseError, void>): UseDataConnectMutationResult<DeleteSchemeData, undefined>;

export function useGetScheme(options?: useDataConnectQueryOptions<GetSchemeData>): UseDataConnectQueryResult<GetSchemeData, undefined>;
export function useGetScheme(dc: DataConnect, options?: useDataConnectQueryOptions<GetSchemeData>): UseDataConnectQueryResult<GetSchemeData, undefined>;

export function useListSchemes(options?: useDataConnectQueryOptions<ListSchemesData>): UseDataConnectQueryResult<ListSchemesData, undefined>;
export function useListSchemes(dc: DataConnect, options?: useDataConnectQueryOptions<ListSchemesData>): UseDataConnectQueryResult<ListSchemesData, undefined>;
