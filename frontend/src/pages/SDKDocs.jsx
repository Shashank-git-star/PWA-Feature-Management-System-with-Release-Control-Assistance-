import { BookOpenText, Boxes, Braces, Database, ExternalLink, GitBranch, Rocket, ShieldAlert } from 'lucide-react';
import api from '../api';
import { useLanguage } from '../i18n.jsx';

const apiGroups = [
    {
        name: 'Authentication',
        endpoints: [
            ['POST', '/auth/signup', 'Create an account. JSON body: email and password.'],
            ['POST', '/auth/login', 'Sign in. Form fields: username (email) and password.'],
            ['GET', '/auth/users', 'List active users.'],
        ],
    },
    {
        name: 'Feature flags and evaluation',
        endpoints: [
            ['POST', '/flags/', 'Create a flag (admin). Body: key, flag_type, default_value, enabled, rollout_percentage; description and owner_team are optional.'],
            ['GET', '/flags/', 'List feature flags.'],
            ['GET', '/flags/{flag_id}', 'Get a feature flag.'],
            ['PUT', '/flags/{flag_id}', 'Update flag settings (admin).'],
            ['DELETE', '/flags/{flag_id}', 'Delete a flag (admin).'],
            ['POST', '/flags/evaluate', 'Evaluate a flag. JSON body: flag_key, environment; user_id and group_id are optional.'],
        ],
    },
    {
        name: 'Environments and overrides',
        endpoints: [
            ['POST', '/environments/', 'Create an environment (admin). Body: name and optional description.'],
            ['GET', '/environments/', 'List environments.'],
            ['GET', '/environments/{env_id}', 'Get an environment.'],
            ['PUT', '/environments/{env_id}', 'Replace environment name and description (admin).'],
            ['DELETE', '/environments/{env_id}', 'Delete an environment (admin).'],
            ['POST', '/overrides/', 'Create an environment override (admin). Body: feature_flag_id, environment_id, value, enabled.'],
            ['GET', '/overrides/', 'List environment overrides.'],
            ['PUT', '/overrides/{override_id}', 'Update override value and/or enabled state (admin).'],
            ['DELETE', '/overrides/{override_id}', 'Delete an override (admin).'],
        ],
    },
    {
        name: 'Targeting and groups',
        endpoints: [
            ['POST', '/targeting/', 'Create a targeting rule (admin). Body: flag_id, target_type (USER or GROUP), target_identifier, value.'],
            ['GET', '/targeting/flag/{flag_id}', 'List targeting rules for a flag.'],
            ['DELETE', '/targeting/{rule_id}', 'Delete a targeting rule (admin).'],
            ['POST', '/groups/', 'Create a group (admin). Body: name.'],
            ['GET', '/groups/', 'List groups.'],
            ['POST', '/groups/{group_id}/add-user/{user_id}', 'Assign a user to a group (admin).'],
        ],
    },
    {
        name: 'Analytics and audit logs',
        endpoints: [
            ['GET', '/analytics/metrics', 'Dashboard totals for flags, evaluations today, and audit events today.'],
            ['GET', '/analytics/flags', 'Evaluation counts by flag. Optional start_date and end_date (YYYY-MM-DD).'],
            ['GET', '/analytics/usage', 'Evaluation counts by environment. Optional start_date and end_date (YYYY-MM-DD).'],
            ['GET', '/audit-logs', 'List the latest audit events (maximum 500). Optional user_id, flag_id, action, start_date, end_date filters.'],
            ['GET', '/audit-logs/{log_id}', 'Get one audit event.'],
        ],
    },
];

const codeBlockClass = 'overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs leading-6 text-slate-100 sm:p-5 sm:text-sm';
const sectionClass = 'scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7';

function FlowNode({ title, detail }) {
    return (
        <div className="min-w-0 flex-1 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-center">
            <p className="font-black text-slate-900">{title}</p>
            <p className="mt-1 wrap-break-word text-xs font-medium text-slate-600">{detail}</p>
        </div>
    );
}

function EndpointGroup({ name, endpoints, t, open = false }) {
    return (
        <details className="group rounded-2xl border border-slate-200 bg-slate-50" open={open}>
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 p-4 font-black text-slate-800 marker:hidden">
                <span>{t(name)}</span>
                <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-slate-500">{endpoints.length} {t('endpoints')}</span>
            </summary>
            <div className="space-y-2 border-t border-slate-200 p-3 sm:p-4">
                {endpoints.map(([method, path, description]) => (
                    <div key={`${method}-${path}`} className="grid min-w-0 gap-2 rounded-xl bg-white p-3 sm:grid-cols-[5rem_minmax(12rem,0.8fr)_minmax(0,1.5fr)] sm:items-start sm:gap-3">
                        <span className={`w-fit rounded-md px-2 py-1 text-[10px] font-black ${
                            method === 'GET' ? 'bg-green-100 text-green-800' :
                            method === 'DELETE' ? 'bg-red-100 text-red-800' :
                            method === 'PUT' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}>{method}</span>
                        <code className="break-all text-xs font-bold text-slate-800">{path}</code>
                        <p className="wrap-break-word text-xs leading-5 text-slate-600">{t(description)}</p>
                    </div>
                ))}
            </div>
        </details>
    );
}

export default function SDKDocs() {
    const { t } = useLanguage();
    const apiDocsUrl = `${api.defaults.baseURL}/docs`;
    const redocUrl = `${api.defaults.baseURL}/redoc`;
    const openApiUrl = `${api.defaults.baseURL}/openapi.json`;

    return (
        <main className="mx-auto min-w-0 max-w-6xl space-y-5 sm:space-y-7">
            <header className="overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-white via-blue-50 to-indigo-50 p-5 shadow-sm sm:rounded-4xl sm:p-8">
                <div className="flex items-start gap-4">
                    <div className="shrink-0 rounded-2xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-200">
                        <BookOpenText size={24} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-widest text-blue-700">{t('Developer guide')}</p>
                        <h1 className="mt-1 wrap-break-word text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{t('SDK Docs')}</h1>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                            {t('A practical guide to the feature-flag service: how requests flow, where data lives, which APIs are available, and how to run the project.')}
                        </p>
                    </div>
                </div>
                <nav aria-label={t('Documentation sections')} className="mt-5 flex gap-2 overflow-x-auto pb-1">
                    {[
                        ['#architecture', t('Architecture')],
                        ['#data-flow', t('Data flow')],
                        ['#api-reference', t('API reference')],
                        ['#database', t('Database')],
                        ['#deployment', t('Deployment')],
                        ['#limitations', t('Limitations')],
                    ].map(([href, label]) => (
                        <a key={href} href={href} className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700">
                            {label}
                        </a>
                    ))}
                </nav>
            </header>

            <section id="architecture" className={sectionClass}>
                <div className="mb-4 flex items-center gap-3">
                    <Boxes className="shrink-0 text-blue-600" size={21} />
                    <div>
                        <h2 className="text-lg font-black text-slate-900">{t('System architecture')}</h2>
                        <p className="text-sm text-slate-500">{t('The browser UI calls the FastAPI service, which reads and writes PostgreSQL and uses Redis for evaluation caching.')}</p>
                    </div>
                </div>
                <div className="flex min-w-0 flex-col items-stretch gap-2 md:flex-row md:items-center">
                    <FlowNode title={t('React + Vite')} detail={t('Dashboard, SDK Docs, API client')} />
                    <span aria-hidden="true" className="self-center rotate-90 text-xl font-black text-blue-400 md:rotate-0">→</span>
                    <FlowNode title="FastAPI" detail={t('Authentication, flags, rules, analytics')} />
                    <span aria-hidden="true" className="self-center rotate-90 text-xl font-black text-blue-400 md:rotate-0">→</span>
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                        <FlowNode title="PostgreSQL" detail={t('Application records and evaluation events')} />
                        <FlowNode title="Redis" detail={t('Evaluation result cache (300-second TTL)')} />
                    </div>
                </div>
            </section>

            <section id="data-flow" className={sectionClass}>
                <div className="mb-4 flex items-center gap-3">
                    <GitBranch className="shrink-0 text-blue-600" size={21} />
                    <div>
                        <h2 className="text-lg font-black text-slate-900">{t('Flag evaluation data flow')}</h2>
                        <p className="text-sm text-slate-500">{t('Each evaluation request is recorded for usage analytics.')}</p>
                    </div>
                </div>
                <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        ['1', t('Request'), t('POST /flags/evaluate sends a flag key, environment, and optional user/group IDs.')],
                        ['2', t('Cache lookup'), t('The API checks Redis for a recent result using the evaluation inputs.')],
                        ['3', t('Resolve and record'), t('On a cache miss, flag, environment, overrides, rollout, and targeting rules determine the result; an evaluation event is stored.')],
                        ['4', t('Response'), t('The API returns the boolean value and reason, then caches the result for 300 seconds.')],
                    ].map(([step, title, detail]) => (
                        <li key={step} className="min-w-0 rounded-2xl border border-slate-200 p-4">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">{step}</span>
                            <h3 className="mt-3 font-black text-slate-900">{title}</h3>
                            <p className="mt-1 wrap-break-word text-xs leading-5 text-slate-600">{detail}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <section id="api-reference" className={sectionClass}>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Braces className="shrink-0 text-blue-600" size={21} />
                        <div>
                            <h2 className="text-lg font-black text-slate-900">{t('API reference')}</h2>
                            <p className="text-sm text-slate-500">{t('Browse the complete, live OpenAPI schema and try requests in FastAPI Swagger UI.')}</p>
                        </div>
                    </div>
                    <a href={apiDocsUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white transition hover:bg-blue-700">
                        Swagger UI <ExternalLink size={15} />
                    </a>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                    <a className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50" href={openApiUrl} target="_blank" rel="noreferrer">OpenAPI JSON</a>
                    <a className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50" href={redocUrl} target="_blank" rel="noreferrer">ReDoc</a>
                </div>
                <p className="mb-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
                    {t('All API data endpoints require a valid bearer token; write operations are admin-only. Signup, login, and the health check are public. Use Swagger Authorize after signing in.')}
                </p>
                <div className="space-y-2">
                    {apiGroups.map((group, index) => <EndpointGroup key={group.name} {...group} t={t} open={index === 0} />)}
                </div>
            </section>

            <section id="database" className={sectionClass}>
                <div className="mb-4 flex items-center gap-3">
                    <Database className="shrink-0 text-blue-600" size={21} />
                    <div>
                        <h2 className="text-lg font-black text-slate-900">{t('Database schema')}</h2>
                        <p className="text-sm text-slate-500">{t('ERD overview of the SQLAlchemy models and their foreign-key relationships.')}</p>
                    </div>
                </div>
                <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {[
                        ['users', 'id (PK), email, hashed_password, is_active, is_admin, group_id (FK), created_at, updated_at'],
                        ['user_groups', 'id (PK), name (unique)'],
                        ['feature_flags', 'id (PK), key (unique), description, flag_type, default_value, enabled, owner_team, rollout_percentage, created_at'],
                        ['environments', 'id (PK), name (unique), description, created_at, updated_at'],
                        ['environment_overrides', 'id (PK), flag_id (FK), environment_id (FK), value, enabled, updated_at'],
                        ['targeting_rules', 'id (PK), flag_id (FK), target_type, target_identifier, value'],
                        ['evaluation_events', 'id (PK), flag_id (FK), environment_id (FK), user_id (FK, nullable), group_id (FK, nullable), evaluated_at'],
                        ['audit_logs', 'id (PK), user_id (FK, nullable), flag_id (FK, nullable), environment_id (FK, nullable), action, old_state, new_state, details, created_at'],
                    ].map(([table, fields]) => (
                        <article key={table} className="min-w-0 rounded-2xl border border-slate-200 p-4">
                            <h3 className="font-mono text-sm font-black text-blue-700">{table}</h3>
                            <p className="mt-2 wrap-break-word text-xs leading-5 text-slate-600">{fields}</p>
                        </article>
                    ))}
                </div>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                    <h3 className="mb-2 text-sm font-black text-slate-800">{t('Entity relationship diagram')}</h3>
                    <p className="mb-3 text-xs text-slate-600">{t('Each connector shows a foreign-key relationship; 1 means one record and * means many records.')}</p>
                    <div className="max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 sm:p-4">
                        <svg
                            role="img"
                            aria-labelledby="erd-title erd-description"
                            viewBox="0 0 1080 610"
                            className="h-auto min-w-225 w-full"
                        >
                            <title id="erd-title">{t('Database entity relationship diagram')}</title>
                            <desc id="erd-description">{t('Diagram linking user groups, users, feature flags, environments, overrides, targeting rules, evaluation events, and audit logs.')}</desc>
                            <g fill="none" stroke="#94a3b8" strokeWidth="2">
                                <path d="M135 158 V238" />
                                <path d="M245 95 H340 V96 H420" />
                                <path d="M245 300 H360 V98 H420" />
                                <path d="M820 98 H665" />
                                <path d="M530 158 V230" />
                                <path d="M645 280 H800" />
                                <path d="M930 158 V210" />
                                <path d="M645 310 H720 V438 H800" />
                                <path d="M245 300 H360 V510 H420" />
                                <path d="M530 348 V450" />
                                <path d="M930 158 V510 H665" />
                            </g>
                            <g fill="#475569" fontFamily="ui-sans-serif, system-ui" fontSize="12" fontWeight="700">
                                <text x="144" y="205">1 : *</text>
                                <text x="323" y="88">1 : *</text>
                                <text x="363" y="285">1 : *</text>
                                <text x="720" y="88">1 : *</text>
                                <text x="540" y="205">1 : *</text>
                                <text x="715" y="270">1 : *</text>
                                <text x="940" y="190">1 : *</text>
                                <text x="730" y="360">1 : *</text>
                                <text x="363" y="495">1 : *</text>
                                <text x="540" y="410">1 : *</text>
                                <text x="795" y="495">1 : *</text>
                            </g>
                            {[
                                { x: 20, y: 40, title: 'user_groups', fields: ['id · PK', 'name · unique'] },
                                { x: 20, y: 245, title: 'users', fields: ['id · PK', 'group_id · FK, nullable', 'email · unique', 'is_admin'] },
                                { x: 420, y: 40, title: 'evaluation_events', fields: ['id · PK', 'flag_id · FK', 'environment_id · FK', 'user_id / group_id · nullable FKs'] },
                                { x: 420, y: 230, title: 'feature_flags', fields: ['id · PK', 'key · unique', 'enabled · rollout_percentage'] },
                                { x: 420, y: 450, title: 'audit_logs', fields: ['id · PK', 'user_id / flag_id / environment_id · nullable FKs', 'action · details · created_at'] },
                                { x: 820, y: 40, title: 'environments', fields: ['id · PK', 'name · unique'] },
                                { x: 820, y: 210, title: 'environment_overrides', fields: ['id · PK', 'flag_id · FK', 'environment_id · FK', 'value · enabled'] },
                                { x: 820, y: 380, title: 'targeting_rules', fields: ['id · PK', 'flag_id · FK', 'target_type · target_identifier · value'] },
                            ].map(({ x, y, title, fields }) => (
                                <g key={title} fontFamily="ui-sans-serif, system-ui">
                                    <rect x={x} y={y} width="245" height="118" rx="14" fill="#eff6ff" stroke="#93c5fd" strokeWidth="2" />
                                    <path d={`M${x} ${y + 35} H${x + 245}`} stroke="#bfdbfe" strokeWidth="1" />
                                    <text x={x + 14} y={y + 24} fill="#1d4ed8" fontSize="15" fontWeight="800">{title}</text>
                                    {fields.map((field, index) => (
                                        <text key={field} x={x + 14} y={y + 54 + index * 17} fill="#334155" fontSize="11">{field}</text>
                                    ))}
                                </g>
                            ))}
                        </svg>
                    </div>
                </div>
            </section>

            <section id="deployment" className={sectionClass}>
                <div className="mb-4 flex items-center gap-3">
                    <Rocket className="shrink-0 text-blue-600" size={21} />
                    <div>
                        <h2 className="text-lg font-black text-slate-900">{t('Deployment guide')}</h2>
                        <p className="text-sm text-slate-500">{t('Current local run workflow and Docker Compose deployment notes.')}</p>
                    </div>
                </div>
                <div className="space-y-4 text-sm leading-6 text-slate-700">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="font-black text-amber-950">{t('Docker Compose status')}</p>
                        <p className="mt-1 text-xs leading-5 text-amber-900">{t('This repository currently has no Dockerfile or Docker Compose manifest. The stack needs PostgreSQL and Redis; Redis is configured for localhost in the current backend. The commands below run those dependencies with Compose while the API and UI run locally.')}</p>
                    </div>
                    <ol className="list-inside list-decimal space-y-2">
                        <li>{t('Install Docker Desktop (or Docker Engine with the Compose plugin), Python dependencies, and Node.js.')}</li>
                        <li>{t('Start PostgreSQL and Redis containers using your Compose file and expose their ports to the host (5432 and 6379).')}</li>
                        <li>{t('Set DATABASE_URL in the backend environment to your PostgreSQL URL, for example:')} <code className="break-all rounded bg-slate-100 px-1.5 py-0.5 text-xs">postgresql://&lt;user&gt;:&lt;password&gt;@localhost:5432/&lt;database&gt;</code>.</li>
                        <li>{t('Set AUTH_TOKEN_SECRET to a random value with at least 32 characters. Generate one with:')} <code className="break-all rounded bg-slate-100 px-1.5 py-0.5 text-xs">python -c "import secrets; print(secrets.token_urlsafe(48))"</code>.</li>
                        <li>{t('In one terminal, activate the Python environment and run')} <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">uvicorn app.main:app --reload</code> {t('from the repository root.')}</li>
                        <li>{t('In another terminal, run')} <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">npm install</code> {t('and')} <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">npm run dev</code> {t('from')} <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">frontend/</code>.</li>
                        <li>{t('Open the frontend at')} <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">http://localhost:5173</code>; {t('the API and interactive docs are at port 8000.')}</li>
                    </ol>
                    <pre className={codeBlockClass}>{`# Check local service health
curl http://localhost:8000/

# OpenAPI interactive docs
http://localhost:8000/docs`}</pre>
                    <p className="text-xs leading-5 text-slate-500">{t('Before production deployment, add maintained API/UI container images and a Compose manifest, configure the Redis host and frontend API URL for the deployment network, disable development reload, use secrets for credentials, and terminate TLS at a trusted proxy.')}</p>
                </div>
            </section>

            <section id="limitations" className={sectionClass}>
                <div className="mb-4 flex items-center gap-3">
                    <ShieldAlert className="shrink-0 text-amber-600" size={21} />
                    <div>
                        <h2 className="text-lg font-black text-slate-900">{t('Known limitations')}</h2>
                        <p className="text-sm text-slate-500">{t('Important behavior to understand before integrating or deploying.')}</p>
                    </div>
                </div>
                <ul className="list-inside list-disc space-y-2 text-sm leading-6 text-slate-700">
                    <li>{t('Authentication uses signed, expiring bearer tokens. Set AUTH_TOKEN_SECRET before starting the API; signing keys are not stored in the database.')}</li>
                    <li>{t('Redis is configured at localhost:6379 in code, and evaluation cache entries last 300 seconds. Production cache host and availability handling are not configurable in this version.')}</li>
                    <li>{t('The frontend API base URL is currently http://localhost:8000; deployment behind another host or path needs configuration work.')}</li>
                    <li>{t('Evaluation and analytics depend on event rows written to PostgreSQL; large event volumes need retention and indexing policies.')}</li>
                    <li>{t('The current checkout has no full-stack Docker Compose deployment manifest; follow the deployment notes above and treat container deployment as future work.')}</li>
                </ul>
            </section>
        </main>
    );
}
