-- CUSTOM TYPES
create type public.app_role as enum ('admin', 'moderator');


create type public.app_permission as enum ('users.delete', 'users.edit');


-- USERS
create table
  public.users (
    -- UUID from auth.users
    id uuid not null primary key,
    email text not null,
    username text
  );


comment on table public.users is 'Profile data for each user.';


comment on column public.users.id is 'References the internal Supabase Auth user.';


-- USER ROLES
create table
  public.user_roles (
    id bigint generated by default as identity primary key,
    user_id uuid references public.users on delete cascade not null,
    role app_role not null,
    unique (user_id, role)
  );


comment on table public.user_roles is 'Application roles for each user.';


-- ROLE PERMISSIONS
create table
  public.role_permissions (
    id bigint generated by default as identity primary key,
    role app_role not null,
    permission app_permission not null,
    unique (role, permission)
  );


comment on table public.role_permissions is 'Application permissions for each role.';


-- authorize with role-based access control (RBAC)
create function public.authorize(requested_permission app_permission, user_id uuid) returns boolean as $$declare bind_permissions int;


begin
select
  count(*)
from
  public.role_permissions
  inner join public.user_roles on role_permissions.role = user_roles.role
where
  role_permissions.permission = authorize.requested_permission
  and user_roles.user_id = authorize.user_id into bind_permissions;


return bind_permissions > 0;


end;


$$language plpgsql security definer;


-- Secure the tables
alter table
  public.users enable row level security;


alter table
  public.user_roles enable row level security;


alter table
  public.role_permissions enable row level security;


create policy "Allow everyone read access" on public.users for
select
  using (true);


create policy "Allow individual insert access" on public.users for insert
with
  check (auth.uid() = id);


create policy "Allow individual update access" on public.users for
update
  using (auth.uid() = id);


create policy "Allow authorized update access" on public.users for
update
  using (authorize('users.edit', auth.uid()));


create policy "Allow authorized delete access" on public.users for delete using (authorize('users.delete', auth.uid()));


create policy "Allow everyone read access" on public.user_roles for
select
  using (true);


-- Send "previous data" on change 
alter table
  public.users replica identity full;


-- inserts a row into public.users and assigns roles
create function public.handle_new_user() returns trigger as $$declare is_admin boolean;


begin
insert into
  public.users (id, email)
values
  (new.id, new.email);


-- first authorized user will be the admin
select
  count(*) = 1
from
  auth.users into is_admin;


if is_admin then
insert into
  public.user_roles (user_id, role)
values
  (new.id, 'admin');


end if;


return new;


end;


$$language plpgsql security definer;


-- trigger the function every time a user is created
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();


/**
 * REALTIME SUBSCRIPTIONS
 * Only allow realtime listening on public tables.
 */
begin;


-- remove the realtime publication
drop publication if exists supabase_realtime;


-- re-create the publication but don't enable it for any tables
create publication supabase_realtime;


commit;


-- add tables to the publication
alter publication supabase_realtime
add
  table public.users;


-- ASSIGN PERMISSIONS
insert into
  public.role_permissions (role, permission)
values
  ('admin', 'users.delete'),
  ('admin', 'users.edit');