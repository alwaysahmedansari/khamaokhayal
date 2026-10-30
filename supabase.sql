-- خامہ و خیال: Supabase setup. NO public accounts: readers read, anyone can SEND a writing, only the admin publishes.
-- Run ONCE: Dashboard > SQL Editor > paste > Run.
-- If you already ran the OLD version of this file, first run this reset block once (remove the leading --):
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop table if exists posts, profiles, private_info, pages, settings, keep_alive cascade;
-- drop function if exists is_admin(), handle_new_user(), profiles_guard(), posts_guard() cascade;
-- delete from storage.buckets where id in ('avatars','covers');  -- (remove old "media: ..." policies in Storage > Policies)

create table admins(user_id uuid primary key references auth.users on delete cascade);
create function is_admin() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from admins where user_id=auth.uid()) $$;

create table authors(id bigint generated always as identity primary key,
  name text not null, bio text not null default '', photo_url text, created_at timestamptz not null default now());

create table posts(id bigint generated always as identity primary key,
  author_id bigint not null references authors(id) on delete cascade,
  title text not null, category text not null default 'کالم', body text not null, cover_url text,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(), published_at timestamptz);
create index posts_feed on posts(status, published_at desc);
create function set_published() returns trigger language plpgsql as
$$ begin if new.status='published' and new.published_at is null then new.published_at:=now(); end if; return new; end $$;
create trigger t_set_published before insert or update on posts for each row execute function set_published();

-- what people send (private: only the admin can read it)
create table submissions(id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 5 and 200),
  bio text not null default '' check (char_length(bio)<=1500),
  photo_url text check (photo_url is null or photo_url like 'https://mqhhpedpkddpifatmgtc.supabase.co/storage/v1/object/public/media/%'),
  title text not null check (char_length(title) between 1 and 200),
  category text not null default 'کالم' check (category in ('کالم','افسانہ','مضمون','شاعری')),
  body text not null check (char_length(body) between 1 and 60000),
  cover_url text check (cover_url is null or cover_url like 'https://mqhhpedpkddpifatmgtc.supabase.co/storage/v1/object/public/media/%'),
  status text not null default 'new' check (status in ('new','reading','returned','approved','rejected')),
  admin_note text, author_id bigint references authors(id) on delete set null,
  post_id bigint references posts(id) on delete set null, created_at timestamptz not null default now());

create table pages(slug text primary key, title text not null, body text not null default '',
  visible boolean not null default true, sort int not null default 0);
create table settings(key text primary key, value text not null default '');
create table keep_alive(id int primary key, pinged timestamptz not null default now());
insert into keep_alive(id) values(1);

alter table admins enable row level security;
alter table authors enable row level security;
alter table posts enable row level security;
alter table submissions enable row level security;
alter table pages enable row level security;
alter table settings enable row level security;
alter table keep_alive enable row level security;

create policy "admins: admin all" on admins for all using (is_admin()) with check (is_admin());
create policy "authors: read" on authors for select using (true);
create policy "authors: admin all" on authors for all using (is_admin()) with check (is_admin());
create policy "posts: read published" on posts for select using (status='published' or is_admin());
create policy "posts: admin all" on posts for all using (is_admin()) with check (is_admin());
create policy "submissions: anyone can send" on submissions for insert to anon, authenticated
  with check (status='new' and admin_note is null and author_id is null and post_id is null);
create policy "submissions: admin all" on submissions for all using (is_admin()) with check (is_admin());
create policy "pages: read" on pages for select using (visible or is_admin());
create policy "pages: admin all" on pages for all using (is_admin()) with check (is_admin());
create policy "settings: read" on settings for select using (true);
create policy "settings: admin all" on settings for all using (is_admin()) with check (is_admin());
create policy "keep_alive: read" on keep_alive for select using (true);

-- images: anyone may upload (max 3 MB, jpg/png/webp, only into submissions/); only the admin can manage files
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
  values('media','media',true,3145728,array['image/jpeg','image/png','image/webp']);
create policy "media: anyone uploads to submissions" on storage.objects for insert to anon, authenticated
  with check (bucket_id='media' and (storage.foldername(name))[1]='submissions');
create policy "media: admin all" on storage.objects for all to authenticated
  using (bucket_id='media' and is_admin()) with check (bucket_id='media' and is_admin());

insert into pages(slug,title,body,sort) values
('about','ہمارے بارے میں','یہاں اپنے بارے میں لکھیں۔',1),
('privacy','پرائیویسی پالیسی','یہاں پرائیویسی پالیسی لکھیں۔',2),
('terms','شرائط و ضوابط','یہاں شرائط لکھیں۔',3),
('guidelines','اشاعت کے اصول','یہاں اشاعت کے اصول لکھیں۔',4),
('contact','رابطہ','یہاں رابطے کی تفصیل لکھیں۔',5);
insert into settings(key,value) values('site_name','خامہ و خیال');

-- ADMIN: Dashboard > Authentication > Users > Add user (your email + password). Then run:
-- insert into admins(user_id) select id from auth.users where email='YOUR_EMAIL';
-- Then Authentication > Sign In / Providers: turn OFF "Allow new users to sign up".
