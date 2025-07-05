# Cogito Database Schema Dump
Generated: 2025-07-03T19:59:04.554Z

## Database Schemas

| Schema | Owner | Likely Source |
|--------|-------|---------------|
| auth | supabase_admin | Supabase Auth |
| client_mgmt | postgres | User-created |
| conversation | postgres | User-created |
| events | postgres | User-created |
| extensions | postgres | PostgreSQL Extensions |
| files | postgres | User-created |
| graphql | supabase_admin | User-created |
| graphql_public | supabase_admin | User-created |
| kanban | postgres | User-created |
| pgbouncer | pgbouncer | User-created |
| public | pg_database_owner | PostgreSQL Default |
| realtime | supabase_admin | Supabase Realtime |
| storage | supabase_admin | Supabase Storage |
| supabase_migrations | postgres | User-created |
| vault | supabase_admin | User-created |

## Schema Details

### Schema: auth

#### Table: auth.audit_log_entries
> Auth: Audit trail for user actions.

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| instance_id | uuid | YES |  |  |
| id | uuid | NO |  |  |
| payload | json | YES |  |  |
| created_at | timestamp with time zone | YES |  |  |
| ip_address | character varying(64) | NO | ''::character varying... |  |

**Indexes:**
- audit_log_entries_pkey (PRIMARY KEY): id
- audit_logs_instance_id_idx (INDEX): instance_id


#### Table: auth.flow_state
> stores metadata for pkce logins

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | uuid | NO |  |  |
| user_id | uuid | YES |  |  |
| auth_code | text | NO |  |  |
| code_challenge_method | USER-DEFINED | NO |  |  |
| code_challenge | text | NO |  |  |
| provider_type | text | NO |  |  |
| provider_access_token | text | YES |  |  |
| provider_refresh_token | text | YES |  |  |
| created_at | timestamp with time zone | YES |  |  |
| updated_at | timestamp with time zone | YES |  |  |
| authentication_method | text | NO |  |  |
| auth_code_issued_at | timestamp with time zone | YES |  |  |

**Indexes:**
- flow_state_created_at_idx (INDEX): created_at
- flow_state_pkey (PRIMARY KEY): id
- idx_auth_code (INDEX): auth_code
- idx_user_id_auth_method (INDEX): user_id, authentication_method


#### Table: auth.identities
> Auth: Stores identities associated to a user.

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| provider_id | text | NO |  |  |
| user_id | uuid | NO |  |  |
| identity_data | jsonb | NO |  |  |
| provider | text | NO |  |  |
| last_sign_in_at | timestamp with time zone | YES |  |  |
| created_at | timestamp with time zone | YES |  |  |
| updated_at | timestamp with time zone | YES |  |  |
| email | text | YES |  | Auth: Email is a generated column that references the optional email property in the identity_data |
| id | uuid | NO | gen_random_uuid()... |  |

**Indexes:**
- identities_email_idx (INDEX): email
- identities_pkey (PRIMARY KEY): id
- identities_provider_id_provider_unique (UNIQUE): provider_id, provider
- identities_user_id_idx (INDEX): user_id


#### Table: auth.instances
> Auth: Manages users across multiple sites.

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | uuid | NO |  |  |
| uuid | uuid | YES |  |  |
| raw_base_config | text | YES |  |  |
| created_at | timestamp with time zone | YES |  |  |
| updated_at | timestamp with time zone | YES |  |  |

**Indexes:**
- instances_pkey (PRIMARY KEY): id


#### Table: auth.mfa_amr_claims
> auth: stores authenticator method reference claims for multi factor authentication

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| session_id | uuid | NO |  |  |
| created_at | timestamp with time zone | NO |  |  |
| updated_at | timestamp with time zone | NO |  |  |
| authentication_method | text | NO |  |  |
| id | uuid | NO |  |  |

**Indexes:**
- amr_id_pk (PRIMARY KEY): id
- mfa_amr_claims_session_id_authentication_method_pkey (UNIQUE): session_id, authentication_method


#### Table: auth.mfa_challenges
> auth: stores metadata about challenge requests made

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | uuid | NO |  |  |
| factor_id | uuid | NO |  |  |
| created_at | timestamp with time zone | NO |  |  |
| verified_at | timestamp with time zone | YES |  |  |
| ip_address | inet | NO |  |  |
| otp_code | text | YES |  |  |
| web_authn_session_data | jsonb | YES |  |  |

**Indexes:**
- mfa_challenge_created_at_idx (INDEX): created_at
- mfa_challenges_pkey (PRIMARY KEY): id


#### Table: auth.mfa_factors
> auth: stores metadata about factors

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | uuid | NO |  |  |
| user_id | uuid | NO |  |  |
| friendly_name | text | YES |  |  |
| factor_type | USER-DEFINED | NO |  |  |
| status | USER-DEFINED | NO |  |  |
| created_at | timestamp with time zone | NO |  |  |
| updated_at | timestamp with time zone | NO |  |  |
| secret | text | YES |  |  |
| phone | text | YES |  |  |
| last_challenged_at | timestamp with time zone | YES |  |  |
| web_authn_credential | jsonb | YES |  |  |
| web_authn_aaguid | uuid | YES |  |  |

**Indexes:**
- factor_id_created_at_idx (INDEX): user_id, created_at
- mfa_factors_last_challenged_at_key (UNIQUE): last_challenged_at
- mfa_factors_pkey (PRIMARY KEY): id
- mfa_factors_user_friendly_name_unique (UNIQUE): friendly_name, user_id
- mfa_factors_user_id_idx (INDEX): user_id
- unique_phone_factor_per_user (UNIQUE): user_id, phone


#### Table: auth.one_time_tokens

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | uuid | NO |  |  |
| user_id | uuid | NO |  |  |
| token_type | USER-DEFINED | NO |  |  |
| token_hash | text | NO |  |  |
| relates_to | text | NO |  |  |
| created_at | timestamp without time zone | NO | now()... |  |
| updated_at | timestamp without time zone | NO | now()... |  |

**Indexes:**
- one_time_tokens_pkey (PRIMARY KEY): id
- one_time_tokens_relates_to_hash_idx (INDEX): relates_to
- one_time_tokens_token_hash_hash_idx (INDEX): token_hash
- one_time_tokens_user_id_token_type_key (UNIQUE): user_id, token_type


#### Table: auth.refresh_tokens
> Auth: Store of tokens used to refresh JWT tokens once they expire.

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| instance_id | uuid | YES |  |  |
| id | bigint | NO | nextval('auth.refresh_tokens_i... |  |
| token | character varying(255) | YES |  |  |
| user_id | character varying(255) | YES |  |  |
| revoked | boolean | YES |  |  |
| created_at | timestamp with time zone | YES |  |  |
| updated_at | timestamp with time zone | YES |  |  |
| parent | character varying(255) | YES |  |  |
| session_id | uuid | YES |  |  |

**Indexes:**
- refresh_tokens_instance_id_idx (INDEX): instance_id
- refresh_tokens_instance_id_user_id_idx (INDEX): instance_id, user_id
- refresh_tokens_parent_idx (INDEX): parent
- refresh_tokens_pkey (PRIMARY KEY): id
- refresh_tokens_session_id_revoked_idx (INDEX): session_id, revoked
- refresh_tokens_token_unique (UNIQUE): token
- refresh_tokens_updated_at_idx (INDEX): updated_at


#### Table: auth.saml_providers
> Auth: Manages SAML Identity Provider connections.

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | uuid | NO |  |  |
| sso_provider_id | uuid | NO |  |  |
| entity_id | text | NO |  |  |
| metadata_xml | text | NO |  |  |
| metadata_url | text | YES |  |  |
| attribute_mapping | jsonb | YES |  |  |
| created_at | timestamp with time zone | YES |  |  |
| updated_at | timestamp with time zone | YES |  |  |
| name_id_format | text | YES |  |  |

**Indexes:**
- saml_providers_entity_id_key (UNIQUE): entity_id
- saml_providers_pkey (PRIMARY KEY): id
- saml_providers_sso_provider_id_idx (INDEX): sso_provider_id


#### Table: auth.saml_relay_states
> Auth: Contains SAML Relay State information for each Service Provider initiated login.

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | uuid | NO |  |  |
| sso_provider_id | uuid | NO |  |  |
| request_id | text | NO |  |  |
| for_email | text | YES |  |  |
| redirect_to | text | YES |  |  |
| created_at | timestamp with time zone | YES |  |  |
| updated_at | timestamp with time zone | YES |  |  |
| flow_state_id | uuid | YES |  |  |

**Indexes:**
- saml_relay_states_created_at_idx (INDEX): created_at
- saml_relay_states_for_email_idx (INDEX): for_email
- saml_relay_states_pkey (PRIMARY KEY): id
- saml_relay_states_sso_provider_id_idx (INDEX): sso_provider_id


#### Table: auth.schema_migrations
> Auth: Manages updates to the auth system.

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| version | character varying(255) | NO |  |  |

**Indexes:**
- schema_migrations_pkey (PRIMARY KEY): version


#### Table: auth.sessions
> Auth: Stores session data associated to a user.

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | uuid | NO |  |  |
| user_id | uuid | NO |  |  |
| created_at | timestamp with time zone | YES |  |  |
| updated_at | timestamp with time zone | YES |  |  |
| factor_id | uuid | YES |  |  |
| aal | USER-DEFINED | YES |  |  |
| not_after | timestamp with time zone | YES |  | Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired. |
| refreshed_at | timestamp without time zone | YES |  |  |
| user_agent | text | YES |  |  |
| ip | inet | YES |  |  |
| tag | text | YES |  |  |

**Indexes:**
- sessions_not_after_idx (INDEX): not_after
- sessions_pkey (PRIMARY KEY): id
- sessions_user_id_idx (INDEX): user_id
- user_id_created_at_idx (INDEX): user_id, created_at


#### Table: auth.sso_domains
> Auth: Manages SSO email address domain mapping to an SSO Identity Provider.

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | uuid | NO |  |  |
| sso_provider_id | uuid | NO |  |  |
| domain | text | NO |  |  |
| created_at | timestamp with time zone | YES |  |  |
| updated_at | timestamp with time zone | YES |  |  |

**Indexes:**
- sso_domains_pkey (PRIMARY KEY): id
- sso_domains_sso_provider_id_idx (INDEX): sso_provider_id


#### Table: auth.sso_providers
> Auth: Manages SSO identity provider information; see saml_providers for SAML.

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | uuid | NO |  |  |
| resource_id | text | YES |  | Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code. |
| created_at | timestamp with time zone | YES |  |  |
| updated_at | timestamp with time zone | YES |  |  |

**Indexes:**
- sso_providers_pkey (PRIMARY KEY): id


#### Table: auth.users
> Auth: Stores user login data within a secure schema.

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| instance_id | uuid | YES |  |  |
| id | uuid | NO |  |  |
| aud | character varying(255) | YES |  |  |
| role | character varying(255) | YES |  |  |
| email | character varying(255) | YES |  |  |
| encrypted_password | character varying(255) | YES |  |  |
| email_confirmed_at | timestamp with time zone | YES |  |  |
| invited_at | timestamp with time zone | YES |  |  |
| confirmation_token | character varying(255) | YES |  |  |
| confirmation_sent_at | timestamp with time zone | YES |  |  |
| recovery_token | character varying(255) | YES |  |  |
| recovery_sent_at | timestamp with time zone | YES |  |  |
| email_change_token_new | character varying(255) | YES |  |  |
| email_change | character varying(255) | YES |  |  |
| email_change_sent_at | timestamp with time zone | YES |  |  |
| last_sign_in_at | timestamp with time zone | YES |  |  |
| raw_app_meta_data | jsonb | YES |  |  |
| raw_user_meta_data | jsonb | YES |  |  |
| is_super_admin | boolean | YES |  |  |
| created_at | timestamp with time zone | YES |  |  |
| updated_at | timestamp with time zone | YES |  |  |
| phone | text | YES | NULL::character varying... |  |
| phone_confirmed_at | timestamp with time zone | YES |  |  |
| phone_change | text | YES | ''::character varying... |  |
| phone_change_token | character varying(255) | YES | ''::character varying... |  |
| phone_change_sent_at | timestamp with time zone | YES |  |  |
| confirmed_at | timestamp with time zone | YES |  |  |
| email_change_token_current | character varying(255) | YES | ''::character varying... |  |
| email_change_confirm_status | smallint | YES | 0... |  |
| banned_until | timestamp with time zone | YES |  |  |
| reauthentication_token | character varying(255) | YES | ''::character varying... |  |
| reauthentication_sent_at | timestamp with time zone | YES |  |  |
| is_sso_user | boolean | NO | false... | Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails. |
| deleted_at | timestamp with time zone | YES |  |  |
| is_anonymous | boolean | NO | false... |  |

**Indexes:**
- confirmation_token_idx (UNIQUE): confirmation_token
- email_change_token_current_idx (UNIQUE): email_change_token_current
- email_change_token_new_idx (UNIQUE): email_change_token_new
- reauthentication_token_idx (UNIQUE): reauthentication_token
- recovery_token_idx (UNIQUE): recovery_token
- users_email_partial_key (UNIQUE): email
- users_instance_id_email_idx (INDEX): instance_id
- users_instance_id_idx (INDEX): instance_id
- users_is_anonymous_idx (INDEX): is_anonymous
- users_phone_key (UNIQUE): phone
- users_pkey (PRIMARY KEY): id


### Schema: client_mgmt

#### Table: client_mgmt.client_llms

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | integer | NO | nextval('client_mgmt.client_ll... |  |
| client_id | bigint | NO |  |  |
| llm_id | bigint | NO |  |  |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |
| updated_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |

**Indexes:**
- client_llms_client_id_llm_id_key (UNIQUE): client_id, llm_id
- client_llms_pkey (PRIMARY KEY): id
- idx_client_llms_client_id (INDEX): client_id
- idx_client_llms_llm_id (INDEX): llm_id

**Foreign Keys:**
- client_llms_client_id_fkey: client_id → client_mgmt.clients(id)
- client_llms_llm_id_fkey: llm_id → client_mgmt.llms(id)


#### Table: client_mgmt.client_prompts

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | integer | NO | nextval('client_mgmt.client_pr... |  |
| client_id | integer | NO |  |  |
| prompt_text | text | NO |  |  |
| label_text | character varying(100) | NO |  |  |
| display_order | double precision | NO |  |  |
| is_active | boolean | YES | true... |  |
| created_at | timestamp without time zone | YES | now()... |  |
| updated_at | timestamp without time zone | YES | now()... |  |
| instructions | text | YES |  |  |

**Indexes:**
- client_prompts_pkey (PRIMARY KEY): id
- idx_client_prompts_client_id (INDEX): client_id
- idx_client_prompts_display_order (INDEX): client_id, display_order

**Foreign Keys:**
- client_prompts_client_id_fkey: client_id → client_mgmt.clients(id)


#### Table: client_mgmt.clients

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | integer | NO | nextval('client_mgmt.clients_i... |  |
| name | character varying(255) | NO |  |  |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |
| current_llm_id | bigint | YES |  |  |
| metadata | jsonb | YES | '{}'::jsonb... |  |

**Indexes:**
- clients_name_key (UNIQUE): name
- clients_pkey (PRIMARY KEY): id


#### Table: client_mgmt.llm_types

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | integer | NO | nextval('client_mgmt.llm_types... |  |
| name | character varying(50) | NO |  |  |
| description | text | YES |  |  |
| api_handler | character varying(100) | NO |  |  |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |
| updated_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |
| client_id | integer | NO | 1... |  |

**Indexes:**
- idx_llm_types_client_id (INDEX): client_id
- llm_types_name_key (UNIQUE): name
- llm_types_pkey (PRIMARY KEY): id

**Foreign Keys:**
- llm_types_client_id_fkey: client_id → client_mgmt.clients(id)


#### Table: client_mgmt.llms

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | integer | NO | nextval('client_mgmt.llms_id_s... |  |
| name | character varying(255) | NO |  |  |
| provider | character varying(255) | NO |  |  |
| model | character varying(255) | NO |  |  |
| api_key | text | NO |  |  |
| temperature | double precision | NO | 0.7... |  |
| max_tokens | integer | NO | 1000... |  |
| type_id | integer | YES |  |  |
| additional_config | jsonb | YES |  |  |
| subdomain | character varying(255) | NO | 'public'::character varying... |  |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |
| updated_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |
| client_id | integer | NO | 1... |  |

**Indexes:**
- idx_llms_client_id (INDEX): client_id
- llms_pkey (PRIMARY KEY): id

**Foreign Keys:**
- llms_client_id_fkey: client_id → client_mgmt.clients(id)
- llms_type_id_fkey: type_id → client_mgmt.llm_types(id)


#### Table: client_mgmt.participant_invitations
> Participant invitation system for client onboarding

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | bigint | NO | nextval('client_mgmt.participa... |  |
| invited_by | bigint | YES |  |  |
| email | text | NO |  |  |
| client_id | integer | NO |  |  |
| invitation_token | text | NO |  | Unique token for invitation links |
| expires_at | timestamp with time zone | NO |  |  |
| accepted_at | timestamp with time zone | YES |  |  |
| created_at | timestamp with time zone | YES | now()... |  |
| invited_to_role | text | YES | 'member'::text... |  |
| personal_message | text | YES |  |  |
| status | character varying(20) | YES | 'pending'::character varying... | Invitation status: pending, accepted, expired, cancelled |

**Indexes:**
- idx_participant_invitations_client (INDEX): client_id
- idx_participant_invitations_email (INDEX): email
- idx_participant_invitations_expires (INDEX): expires_at
- idx_participant_invitations_status (INDEX): status
- idx_participant_invitations_token (INDEX): invitation_token
- participant_invitations_invitation_token_key (UNIQUE): invitation_token
- participant_invitations_pkey (PRIMARY KEY): id

**Foreign Keys:**
- participant_invitations_client_id_fkey: client_id → client_mgmt.clients(id)


#### Table: client_mgmt.users

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | uuid | NO | uuid_generate_v4()... |  |
| email | character varying(255) | NO |  |  |
| client_id | integer | YES | 1... |  |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |
| last_login | timestamp with time zone | YES |  |  |
| is_active | boolean | YES | true... |  |
| metadata | jsonb | YES | '{}'::jsonb... |  |
| password_hash | text | YES |  |  |

**Indexes:**
- idx_users_email (INDEX): email
- users_pkey (PRIMARY KEY): id

**Foreign Keys:**
- users_client_id_fkey: client_id → client_mgmt.clients(id)


### Schema: conversation

#### Table: conversation.analytical_insights

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | bigint | NO | nextval('conversation.analytic... |  |
| thinking_process_id | bigint | YES |  |  |
| participant_id | bigint | YES |  |  |
| insight_type | character varying(100) | YES |  |  |
| insight_description | text | NO |  |  |
| triggered_by | text | YES |  |  |
| significance_level | character varying(50) | YES |  |  |
| actionable_implications | ARRAY | YES |  |  |
| affects_components | ARRAY | YES |  |  |
| generalizable | boolean | YES | false... |  |
| pattern_template | text | YES |  |  |
| questions_raised | ARRAY | YES |  |  |
| exploration_needed | ARRAY | YES |  |  |
| embedding | USER-DEFINED | YES |  |  |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |

**Indexes:**
- analytical_insights_pkey (PRIMARY KEY): id
- idx_analytical_insights_vector (INDEX): embedding

**Foreign Keys:**
- analytical_insights_participant_id_fkey: participant_id → conversation.participants(id)
- analytical_insights_thinking_process_id_fkey: thinking_process_id → conversation.thinking_processes(id)


#### Table: conversation.block_lens_version

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | uuid | NO | gen_random_uuid()... |  |
| block_id | uuid | YES |  |  |
| lens_prototype_id | uuid | YES |  |  |
| applied_prompt | text | NO |  |  |
| lens_result | text | YES |  |  |
| lens_embedding | USER-DEFINED | YES |  |  |
| created_at | timestamp with time zone | YES | now()... |  |
| applied_by | character varying(255) | YES |  |  |
| notes | text | YES |  |  |

**Indexes:**
- block_lens_version_pkey (PRIMARY KEY): id
- idx_block_lens_version_block (INDEX): block_id
- idx_block_lens_version_created_at (INDEX): created_at
- idx_block_lens_version_prototype (INDEX): lens_prototype_id

**Foreign Keys:**
- block_lens_version_block_id_fkey: block_id → conversation.blocks(block_id)
- block_lens_version_lens_prototype_id_fkey: lens_prototype_id → conversation.lens_prototypes(prototype_id)


#### Table: conversation.block_turns
> Links turns to blocks with ordering - new architecture (created 2025-06-29)

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| block_id | uuid | NO |  |  |
| turn_id | uuid | NO |  |  |
| sequence_order | integer | YES |  |  |

**Indexes:**
- block_turns_pkey (PRIMARY KEY): block_id, turn_id
- idx_block_turns_block (INDEX): block_id
- idx_block_turns_sequence (INDEX): block_id, sequence_order
- idx_block_turns_turn (INDEX): turn_id

**Foreign Keys:**
- block_turns_block_id_fkey: block_id → conversation.blocks(block_id)
- block_turns_turn_id_fkey: turn_id → conversation.turns(turn_id)


#### Table: conversation.blocks
> Flexible content grouping - replaces conversations table (migrated 2025-06-29)

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| block_id | uuid | NO | gen_random_uuid()... |  |
| name | character varying(255) | YES |  |  |
| description | text | YES |  |  |
| created_at | timestamp with time zone | YES | now()... |  |
| created_by | character varying(255) | YES |  |  |
| block_type | character varying(50) | YES |  |  |
| metadata | jsonb | YES | '{}'::jsonb... |  |

**Indexes:**
- blocks_pkey (PRIMARY KEY): block_id
- idx_blocks_created_at (INDEX): created_at
- idx_blocks_created_by (INDEX): created_by
- idx_blocks_type (INDEX): block_type


#### Table: conversation.concept_connections

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | bigint | NO | nextval('conversation.concept_... |  |
| thinking_process_id | bigint | YES |  |  |
| concept_a | character varying(255) | NO |  |  |
| concept_b | character varying(255) | NO |  |  |
| connection_type | character varying(100) | YES |  |  |
| connection_strength | numeric | YES |  |  |
| significance | text | YES |  |  |
| implications | ARRAY | YES |  |  |
| supporting_evidence | ARRAY | YES |  |  |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |

**Indexes:**
- concept_connections_pkey (PRIMARY KEY): id

**Foreign Keys:**
- concept_connections_thinking_process_id_fkey: thinking_process_id → conversation.thinking_processes(id)


#### Table: conversation.detected_patterns
> Detected patterns with relaxed constraints - only participant_id and pattern_type_id are required

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | bigint | NO | nextval('conversation.detected... |  |
| pattern_type_id | bigint | NO |  |  |
| conversation_id | bigint | YES |  |  |
| interaction_id | bigint | YES |  |  |
| participant_id | bigint | YES |  |  |
| confidence_score | numeric | NO |  |  |
| pattern_data | jsonb | YES | '{}'::jsonb... |  |
| reasoning | text | YES |  |  |
| context_scope | character varying(50) | NO |  |  |
| detected_at | timestamp with time zone | YES | now()... |  |

**Indexes:**
- detected_patterns_pkey (PRIMARY KEY): id
- idx_detected_patterns_conversation (INDEX): conversation_id
- idx_detected_patterns_participant (INDEX): participant_id
- idx_detected_patterns_pattern_type (INDEX): pattern_type_id

**Foreign Keys:**
- detected_patterns_participant_id_fkey: participant_id → conversation.participants(id)
- detected_patterns_pattern_type_id_fkey: pattern_type_id → conversation.pattern_types(id)


#### Table: conversation.lens_prototypes

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| prototype_id | uuid | NO | gen_random_uuid()... |  |
| name | character varying(100) | NO |  |  |
| description | text | YES |  |  |
| base_prompt | text | NO |  |  |
| created_at | timestamp with time zone | YES | now()... |  |
| created_by | character varying(255) | YES |  |  |

**Indexes:**
- idx_lens_prototypes_name (INDEX): name
- lens_prototypes_pkey (PRIMARY KEY): prototype_id


#### Table: conversation.participant_connections

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | bigint | NO | nextval('conversation.particip... |  |
| participant_id | bigint | YES |  |  |
| connection_type | character varying(50) | NO |  |  |
| connection_value | character varying(500) | NO |  |  |
| is_primary | boolean | YES | false... |  |
| is_verified | boolean | YES | false... |  |
| metadata | jsonb | YES | '{}'::jsonb... |  |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |

**Indexes:**
- idx_participant_connections_participant (INDEX): participant_id
- idx_participant_connections_type_value (INDEX): connection_type, connection_value
- participant_connections_connection_type_connection_value_key (UNIQUE): connection_type, connection_value
- participant_connections_pkey (PRIMARY KEY): id

**Foreign Keys:**
- participant_connections_participant_id_fkey: participant_id → conversation.participants(id)


#### Table: conversation.participant_llms

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | bigint | NO | nextval('conversation.particip... |  |
| participant_id | bigint | NO |  |  |
| llm_id | integer | NO |  |  |
| created_at | timestamp with time zone | YES | now()... |  |
| client_id | integer | NO | 1... |  |

**Indexes:**
- idx_participant_llms_client_id (INDEX): client_id
- participant_llms_participant_id_llm_id_key (UNIQUE): participant_id, llm_id
- participant_llms_pkey (PRIMARY KEY): id

**Foreign Keys:**
- participant_llms_participant_id_fkey: participant_id → conversation.participants(id)


#### Table: conversation.participant_patterns

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | bigint | NO | nextval('conversation.particip... |  |
| participant_id | bigint | YES |  |  |
| pattern_type | character varying(100) | YES |  |  |
| pattern_name | character varying(255) | YES |  |  |
| pattern_data | jsonb | NO |  |  |
| embedding | USER-DEFINED | YES |  |  |
| importance_weight | numeric | YES | 0.5... |  |
| confidence_level | numeric | YES |  |  |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |
| updated_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |

**Indexes:**
- idx_participant_patterns_vector (INDEX): embedding
- participant_patterns_pkey (PRIMARY KEY): id

**Foreign Keys:**
- participant_patterns_participant_id_fkey: participant_id → conversation.participants(id)


#### Table: conversation.participants

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | bigint | NO | nextval('conversation.particip... |  |
| name | character varying(255) | NO |  |  |
| type | character varying(50) | NO |  |  |
| user_id | uuid | YES |  | References client_mgmt.users.id |
| current_patterns_embedding | USER-DEFINED | YES |  |  |
| metadata | jsonb | YES | '{}'::jsonb... | Includes patterns (migrated from conversation_participants.participant_patterns) |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |
| updated_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |
| is_active | boolean | YES | true... |  |
| current_llm_id | integer | YES |  |  |

**Indexes:**
- idx_participants_type (INDEX): type
- idx_participants_user (INDEX): user_id
- participants_pkey (PRIMARY KEY): id


#### Table: conversation.pattern_types
> Catalog of conversational patterns (like Christopher Alexander pattern language)

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | bigint | NO | nextval('conversation.pattern_... |  |
| name | character varying(100) | NO |  |  |
| display_name | character varying(255) | YES |  |  |
| description | text | YES |  |  |
| scope_types | ARRAY | YES |  |  |
| detection_instructions | text | YES |  |  |
| analysis_instructions | text | YES |  |  |
| application_instructions | text | YES |  |  |
| examples | jsonb | YES | '[]'::jsonb... |  |
| usefulness_score | numeric | YES | 0.5... |  |
| usage_count | integer | YES | 0... |  |
| is_active | boolean | YES | true... |  |
| created_at | timestamp with time zone | YES | now()... |  |
| updated_at | timestamp with time zone | YES | now()... |  |

**Indexes:**
- idx_pattern_types_name (INDEX): name
- pattern_types_name_key (UNIQUE): name
- pattern_types_pkey (PRIMARY KEY): id


#### Table: conversation.personalities

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | bigint | NO | nextval('conversation.personal... |  |
| participant_id | bigint | YES |  |  |
| name | character varying(255) | NO |  |  |
| display_name | character varying(255) | YES |  |  |
| description | text | YES |  |  |
| personality_type | character varying(50) | NO |  |  |
| domain | character varying(100) | YES |  |  |
| specialization | text | YES |  |  |
| system_prompt | text | YES |  |  |
| instructions | text | YES |  |  |
| conversation_style | text | YES |  |  |
| current_config | jsonb | YES | '{}'::jsonb... |  |
| button_label | character varying(100) | YES |  |  |
| button_order | integer | YES | 0... |  |
| is_visible | boolean | YES | true... |  |
| owner_participant_id | bigint | YES |  |  |
| client_id | integer | YES |  |  |
| status | character varying(50) | YES | 'active'::character varying... |  |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |
| updated_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |

**Indexes:**
- personalities_pkey (PRIMARY KEY): id

**Foreign Keys:**
- personalities_owner_participant_id_fkey: owner_participant_id → conversation.participants(id)
- personalities_participant_id_fkey: participant_id → conversation.participants(id)


#### Table: conversation.personality_evolutions

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | bigint | NO | nextval('conversation.personal... |  |
| personality_id | bigint | YES |  |  |
| participant_id | bigint | YES |  |  |
| version | character varying(20) | NO |  |  |
| changes | text | NO |  |  |
| reasoning | text | NO |  |  |
| context | text | YES |  |  |
| triggered_by_turn_id | bigint | YES |  |  |
| triggered_by_thinking_id | bigint | YES |  |  |
| config_before | jsonb | YES |  |  |
| config_after | jsonb | YES |  |  |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |

**Indexes:**
- personality_evolutions_pkey (PRIMARY KEY): id

**Foreign Keys:**
- personality_evolutions_participant_id_fkey: participant_id → conversation.participants(id)
- personality_evolutions_personality_id_fkey: personality_id → conversation.personalities(id)
- personality_evolutions_triggered_by_thinking_id_fkey: triggered_by_thinking_id → conversation.thinking_processes(id)


#### Table: conversation.thinking_processes

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | bigint | NO | nextval('conversation.thinking... |  |
| participant_id | bigint | YES |  |  |
| conversation_turn_id | bigint | YES |  |  |
| session_id | character varying(100) | YES |  |  |
| project_id | bigint | YES |  |  |
| process_type | character varying(100) | NO |  |  |
| trigger_context | text | NO |  |  |
| reasoning_chain | text | NO |  |  |
| concepts_connected | ARRAY | YES |  |  |
| insights_generated | ARRAY | YES |  |  |
| alternatives_considered | ARRAY | YES |  |  |
| synthesis_achieved | text | YES |  |  |
| design_implications | ARRAY | YES |  |  |
| future_considerations | ARRAY | YES |  |  |
| patterns_recognized | ARRAY | YES |  |  |
| connections_to_previous | ARRAY | YES |  |  |
| confidence_level | numeric | YES |  |  |
| complexity_level | character varying(50) | YES |  |  |
| thinking_duration_estimate | integer | YES |  |  |
| created_at | timestamp with time zone | YES | CURRENT_TIMESTAMP... |  |

**Indexes:**
- idx_thinking_processes_participant (INDEX): participant_id
- idx_thinking_processes_session (INDEX): session_id
- thinking_processes_pkey (PRIMARY KEY): id

**Foreign Keys:**
- thinking_processes_participant_id_fkey: participant_id → conversation.participants(id)


#### Table: conversation.turns
> Individual content units - replaces conversation_interactions (migrated 2025-06-29)

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| turn_id | uuid | NO | gen_random_uuid()... |  |
| content | text | YES |  |  |
| timestamp | timestamp with time zone | YES | now()... |  |
| source_type | character varying(50) | YES |  |  |
| source_turn_id | character varying(255) | YES |  |  |
| metadata | jsonb | YES | '{}'::jsonb... |  |
| client_id | integer | YES |  |  |
| content_vector | USER-DEFINED | YES |  | Embedding of the actual turn content text |
| story_vector | USER-DEFINED | YES |  | Embedding of [group_story_snapshot, individual_story_expression, story_dynamics_shift] |
| story_text | text | YES |  | Human-readable description of conversational story state for this turn |

**Indexes:**
- idx_turns_content_vector (INDEX): content_vector
- idx_turns_source_turn_id (INDEX): source_type, source_turn_id
- idx_turns_source_type (INDEX): source_type
- idx_turns_story_vector (INDEX): story_vector
- idx_turns_timestamp (INDEX): timestamp
- turns_pkey (PRIMARY KEY): turn_id


### Schema: events

#### Table: events.participant_event_categories

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | integer | NO | nextval('events.participant_ev... |  |
| name | character varying(50) | NO |  |  |
| description | text | YES |  |  |
| active | boolean | NO | true... |  |
| created_at | timestamp with time zone | NO | now()... |  |
| client_id | integer | NO | 1... |  |

**Indexes:**
- idx_participant_event_categories_client_id (INDEX): client_id
- participant_event_categories_name_key (UNIQUE): name
- participant_event_categories_pkey (PRIMARY KEY): id


#### Table: events.participant_event_logs

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | integer | NO | nextval('events.participant_ev... |  |
| schema_id | integer | YES |  |  |
| participant_id | integer | YES |  |  |
| event_type_id | integer | YES |  |  |
| description | text | YES |  |  |
| details | jsonb | YES |  |  |
| ip_address | character varying(45) | YES |  |  |
| user_agent | text | YES |  |  |
| created_at | timestamp with time zone | NO | now()... |  |
| client_id | integer | NO | 1... |  |

**Indexes:**
- idx_participant_event_logs_client_id (INDEX): client_id
- idx_participant_event_logs_event_type_id (INDEX): event_type_id
- idx_participant_event_logs_participant_id (INDEX): participant_id
- participant_event_logs_pkey (PRIMARY KEY): id

**Foreign Keys:**
- participant_event_logs_event_type_id_fkey: event_type_id → events.participant_event_types(id)


#### Table: events.participant_event_types

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | integer | NO | nextval('events.participant_ev... |  |
| name | text | NO |  |  |
| description | text | NO |  |  |
| participant_event_categories_id | bigint | YES |  |  |
| client_id | integer | NO | 1... |  |

**Indexes:**
- idx_participant_event_types_client_id (INDEX): client_id
- participant_event_types_pkey (PRIMARY KEY): id

**Foreign Keys:**
- participant_event_types_participant_event_categories_id_fkey: participant_event_categories_id → events.participant_event_categories(id)


#### Table: events.participant_events

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | integer | NO | nextval('events.participant_ev... |  |
| participant_id | bigint | NO |  |  |
| event_type_id | integer | NO |  |  |
| details | jsonb | YES |  |  |
| created_at | timestamp with time zone | NO | now()... |  |
| client_id | integer | NO | 1... |  |

**Indexes:**
- idx_participant_events_client_id (INDEX): client_id
- idx_participant_events_event_type_id (INDEX): event_type_id
- idx_participant_events_participant_id (INDEX): participant_id
- participant_events_pkey (PRIMARY KEY): id

**Foreign Keys:**
- participant_events_event_type_id_fkey: event_type_id → events.participant_event_types(id)


### Schema: extensions

*No tables in this schema*

### Schema: files

#### Table: files.file_types

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | bigint | NO | nextval('files.file_types_id_s... |  |
| name | text | NO |  |  |
| description | text | YES |  |  |
| client_id | integer | NO |  |  |

**Indexes:**
- file_types_name_key (UNIQUE): name
- file_types_pkey (PRIMARY KEY): id
- idx_file_types_client_id (INDEX): client_id


#### Table: files.file_upload_vectors

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | integer | NO | nextval('files.file_upload_vec... |  |
| file_upload_id | integer | NO |  |  |
| chunk_index | integer | NO |  |  |
| content_text | text | NO |  |  |
| content_vector | USER-DEFINED | YES |  |  |
| created_at | timestamp with time zone | YES | now()... |  |
| client_id | integer | NO | 1... |  |

**Indexes:**
- file_upload_vectors_file_upload_id_chunk_index_key (UNIQUE): file_upload_id, chunk_index
- file_upload_vectors_pkey (PRIMARY KEY): id

**Foreign Keys:**
- file_upload_vectors_file_upload_id_fkey: file_upload_id → files.file_uploads(id)


#### Table: files.file_uploads

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | integer | NO | nextval('files.file_uploads_id... |  |
| filename | text | NO |  |  |
| mime_type | text | YES |  |  |
| file_path | text | NO |  |  |
| file_size | bigint | YES |  |  |
| public_url | text | YES |  |  |
| bucket_name | text | YES |  |  |
| uploaded_at | timestamp with time zone | YES | now()... |  |
| description | text | YES |  |  |
| tags | ARRAY | YES |  |  |
| client_id | integer | NO | 1... |  |

**Indexes:**
- file_uploads_pkey (PRIMARY KEY): id
- idx_file_uploads_client_id (INDEX): client_id


### Schema: graphql

*No tables in this schema*

### Schema: graphql_public

*No tables in this schema*

### Schema: kanban

#### Table: kanban.kanban_boards

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| board_id | integer | NO | nextval('kanban.kanban_boards_... |  |
| game_id | bigint | YES |  |  |
| board_name | character varying(255) | YES |  |  |
| board_config | jsonb | YES | '{}'::jsonb... |  |
| created_at | timestamp without time zone | YES | now()... |  |

**Indexes:**
- kanban_boards_pkey (PRIMARY KEY): board_id

**Foreign Keys:**
- kanban_boards_game_id_fkey: game_id → kanban.kanban_games(game_id)


#### Table: kanban.kanban_columns

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| column_id | integer | NO | nextval('kanban.kanban_columns... |  |
| board_id | bigint | YES |  |  |
| column_name | character varying(100) | YES |  |  |
| column_position | integer | YES |  |  |
| wip_limit | integer | YES |  |  |
| column_rules | jsonb | YES | '{}'::jsonb... |  |
| created_at | timestamp without time zone | YES | now()... |  |

**Indexes:**
- kanban_columns_pkey (PRIMARY KEY): column_id

**Foreign Keys:**
- kanban_columns_board_id_fkey: board_id → kanban.kanban_boards(board_id)


#### Table: kanban.kanban_games

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| game_id | integer | NO | nextval('kanban.kanban_games_g... |  |
| client_id | integer | YES |  |  |
| game_name | character varying(255) | YES |  |  |
| game_type | character varying(50) | YES |  |  |
| start_timestamp | timestamp without time zone | YES | now()... |  |
| end_timestamp | timestamp without time zone | YES |  |  |
| status | character varying(20) | YES | 'active'::character varying... |  |
| game_metadata | jsonb | YES | '{}'::jsonb... |  |
| created_at | timestamp without time zone | YES | now()... |  |

**Indexes:**
- idx_kanban_games_client_id (INDEX): client_id
- kanban_games_pkey (PRIMARY KEY): game_id


#### Table: kanban.kanban_moves

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| move_id | integer | NO | nextval('kanban.kanban_moves_m... |  |
| game_id | bigint | YES |  |  |
| move_turn_id | uuid | YES |  |  |
| response_turn_id | uuid | YES |  |  |
| move_notation | text | YES |  |  |
| move_sequence | integer | YES |  |  |
| move_data | jsonb | YES | '{}'::jsonb... |  |
| board_state_before | jsonb | YES |  |  |
| board_state_after | jsonb | YES |  |  |
| snapshot_requested_by | text | YES |  |  |
| snapshot_reason | text | YES |  |  |
| created_at | timestamp without time zone | YES | now()... |  |

**Indexes:**
- idx_kanban_moves_game_id (INDEX): game_id
- idx_kanban_moves_sequence (INDEX): game_id, move_sequence
- kanban_moves_pkey (PRIMARY KEY): move_id

**Foreign Keys:**
- kanban_moves_game_id_fkey: game_id → kanban.kanban_games(game_id)


#### Table: kanban.kanban_snapshots

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| snapshot_id | integer | NO | nextval('kanban.kanban_snapsho... |  |
| game_id | bigint | YES |  |  |
| move_id | bigint | YES |  |  |
| snapshot_notation | text | YES |  |  |
| full_snapshot | jsonb | YES |  |  |
| snapshot_hash | character varying(64) | YES |  |  |
| snapshot_requested_by | text | YES | 'system'::text... |  |
| snapshot_reason | text | YES |  |  |
| snapshot_confidence | numeric | YES |  |  |
| pattern_tags | ARRAY | YES |  |  |
| strategic_significance | text | YES |  |  |
| created_at | timestamp without time zone | YES | now()... |  |

**Indexes:**
- idx_kanban_snapshots_game_id (INDEX): game_id
- idx_kanban_snapshots_hash (INDEX): snapshot_hash
- kanban_snapshots_pkey (PRIMARY KEY): snapshot_id

**Foreign Keys:**
- kanban_snapshots_game_id_fkey: game_id → kanban.kanban_games(game_id)
- kanban_snapshots_move_id_fkey: move_id → kanban.kanban_moves(move_id)


#### Table: kanban.kanban_tasks

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| task_id | integer | NO | nextval('kanban.kanban_tasks_t... |  |
| board_id | bigint | YES |  |  |
| task_number | integer | YES |  |  |
| task_title | character varying(255) | YES |  |  |
| current_column | character varying(100) | YES |  |  |
| task_metadata | jsonb | YES | '{}'::jsonb... |  |
| created_at | timestamp without time zone | YES | now()... |  |
| updated_at | timestamp without time zone | YES | now()... |  |

**Indexes:**
- idx_kanban_tasks_board_id (INDEX): board_id
- kanban_tasks_pkey (PRIMARY KEY): task_id

**Foreign Keys:**
- kanban_tasks_board_id_fkey: board_id → kanban.kanban_boards(board_id)


### Schema: pgbouncer

*No tables in this schema*

### Schema: public

#### Table: public.conversation_tables_final_backup
> Final backup of conversation tables before removal - Migration 008

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| table_name | text | YES |  |  |
| record_id | bigint | YES |  |  |
| data | json | YES |  |  |
| backup_timestamp | timestamp with time zone | YES |  |  |


#### Table: public.locations

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | integer | NO | nextval('locations_id_seq'::re... |  |
| file_path | text | NO |  |  |
| description | text | NO |  |  |
| project | character varying(100) | YES |  |  |
| category | character varying(50) | YES |  |  |
| tags | text | YES |  |  |
| created_at | timestamp with time zone | YES | now()... |  |
| updated_at | timestamp with time zone | YES | now()... |  |
| last_accessed | timestamp with time zone | YES | now()... |  |

**Indexes:**
- idx_locations_category (INDEX): category
- idx_locations_description (INDEX): description
- idx_locations_project (INDEX): project
- locations_file_path_key (UNIQUE): file_path
- locations_pkey (PRIMARY KEY): id


#### Table: public.projects_backup
> Backup of projects table before removal - projects now handled as metadata

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| table_name | text | YES |  |  |
| record_id | bigint | YES |  |  |
| data | json | YES |  |  |
| backup_timestamp | timestamp with time zone | YES |  |  |


#### Table: public.topic_paths_backup
> Backup of topic_paths table before removal - topics now handled as metadata

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| table_name | text | YES |  |  |
| record_id | bigint | YES |  |  |
| data | json | YES |  |  |
| backup_timestamp | timestamp with time zone | YES |  |  |


### Schema: realtime

#### Table: realtime.messages

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| topic | text | NO |  |  |
| extension | text | NO |  |  |
| payload | jsonb | YES |  |  |
| event | text | YES |  |  |
| private | boolean | YES | false... |  |
| updated_at | timestamp without time zone | NO | now()... |  |
| inserted_at | timestamp without time zone | NO | now()... |  |
| id | uuid | NO | gen_random_uuid()... |  |

**Indexes:**
- messages_pkey (PRIMARY KEY): id, inserted_at


#### Table: realtime.schema_migrations

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| version | bigint | NO |  |  |
| inserted_at | timestamp without time zone | YES |  |  |

**Indexes:**
- schema_migrations_pkey (PRIMARY KEY): version


#### Table: realtime.subscription

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | bigint | NO |  |  |
| subscription_id | uuid | NO |  |  |
| entity | regclass | NO |  |  |
| filters | ARRAY | NO | '{}'::realtime.user_defined_fi... |  |
| claims | jsonb | NO |  |  |
| claims_role | regrole | NO |  |  |
| created_at | timestamp without time zone | NO | timezone('utc'::text, now())... |  |

**Indexes:**
- ix_realtime_subscription_entity (INDEX): entity
- pk_subscription (PRIMARY KEY): id
- subscription_subscription_id_entity_filters_key (UNIQUE): subscription_id, entity, filters


### Schema: storage

#### Table: storage.buckets

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | text | NO |  |  |
| name | text | NO |  |  |
| owner | uuid | YES |  | Field is deprecated, use owner_id instead |
| created_at | timestamp with time zone | YES | now()... |  |
| updated_at | timestamp with time zone | YES | now()... |  |
| public | boolean | YES | false... |  |
| avif_autodetection | boolean | YES | false... |  |
| file_size_limit | bigint | YES |  |  |
| allowed_mime_types | ARRAY | YES |  |  |
| owner_id | text | YES |  |  |

**Indexes:**
- bname (UNIQUE): name
- buckets_pkey (PRIMARY KEY): id


#### Table: storage.migrations

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | integer | NO |  |  |
| name | character varying(100) | NO |  |  |
| hash | character varying(40) | NO |  |  |
| executed_at | timestamp without time zone | YES | CURRENT_TIMESTAMP... |  |

**Indexes:**
- migrations_name_key (UNIQUE): name
- migrations_pkey (PRIMARY KEY): id


#### Table: storage.objects

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | uuid | NO | gen_random_uuid()... |  |
| bucket_id | text | YES |  |  |
| name | text | YES |  |  |
| owner | uuid | YES |  | Field is deprecated, use owner_id instead |
| created_at | timestamp with time zone | YES | now()... |  |
| updated_at | timestamp with time zone | YES | now()... |  |
| last_accessed_at | timestamp with time zone | YES | now()... |  |
| metadata | jsonb | YES |  |  |
| path_tokens | ARRAY | YES |  |  |
| version | text | YES |  |  |
| owner_id | text | YES |  |  |
| user_metadata | jsonb | YES |  |  |

**Indexes:**
- bucketid_objname (UNIQUE): bucket_id, name
- idx_objects_bucket_id_name (INDEX): bucket_id, name
- name_prefix_search (INDEX): name
- objects_pkey (PRIMARY KEY): id


#### Table: storage.s3_multipart_uploads

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | text | NO |  |  |
| in_progress_size | bigint | NO | 0... |  |
| upload_signature | text | NO |  |  |
| bucket_id | text | NO |  |  |
| key | text | NO |  |  |
| version | text | NO |  |  |
| owner_id | text | YES |  |  |
| created_at | timestamp with time zone | NO | now()... |  |
| user_metadata | jsonb | YES |  |  |

**Indexes:**
- idx_multipart_uploads_list (INDEX): bucket_id, key, created_at
- s3_multipart_uploads_pkey (PRIMARY KEY): id


#### Table: storage.s3_multipart_uploads_parts

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | uuid | NO | gen_random_uuid()... |  |
| upload_id | text | NO |  |  |
| size | bigint | NO | 0... |  |
| part_number | integer | NO |  |  |
| bucket_id | text | NO |  |  |
| key | text | NO |  |  |
| etag | text | NO |  |  |
| owner_id | text | YES |  |  |
| version | text | NO |  |  |
| created_at | timestamp with time zone | NO | now()... |  |

**Indexes:**
- s3_multipart_uploads_parts_pkey (PRIMARY KEY): id


### Schema: supabase_migrations

#### Table: supabase_migrations.schema_migrations

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| version | text | NO |  |  |
| statements | ARRAY | YES |  |  |
| name | text | YES |  |  |

**Indexes:**
- schema_migrations_pkey (PRIMARY KEY): version


#### Table: supabase_migrations.seed_files

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| path | text | NO |  |  |
| hash | text | NO |  |  |

**Indexes:**
- seed_files_pkey (PRIMARY KEY): path


### Schema: vault

#### Table: vault.secrets
> Table with encrypted `secret` column for storing sensitive information on disk.

| Column | Type | Nullable | Default | Comment |
|--------|------|----------|---------|---------|
| id | uuid | NO | gen_random_uuid()... |  |
| name | text | YES |  |  |
| description | text | NO | ''::text... |  |
| secret | text | NO |  |  |
| key_id | uuid | YES |  |  |
| nonce | bytea | YES | vault._crypto_aead_det_noncege... |  |
| created_at | timestamp with time zone | NO | CURRENT_TIMESTAMP... |  |
| updated_at | timestamp with time zone | NO | CURRENT_TIMESTAMP... |  |

**Indexes:**
- secrets_name_idx (UNIQUE): name
- secrets_pkey (PRIMARY KEY): id

