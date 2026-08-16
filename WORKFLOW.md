# MAHA Marathon — Demo Workflow Map

```mermaid
flowchart TD
    A[GoDaddy: mahamarathon.co.in] --> B[Vercel: Next.js application]
    B --> C[/register]
    B --> D[/dashboard]
    B --> E[/admin]

    C --> F[Supabase RPC: register_participant]
    F --> G[(Supabase PostgreSQL)]
    G --> H[Unique district Bib number]
    H --> C

    D --> I[Supabase RPC: get_dashboard_stats]
    I --> G
    I --> D

    E --> J[Supabase Auth - next milestone]
    J --> K[profiles]
    K --> L[volunteer_permissions]
    L --> G

    M[GitHub repository] --> N[Vercel Git deployment]
    N --> B

    O[Master QR] --> P[register.mahamarathon.co.in]
    P --> C
```

## Meeting demo flow

1. Scan/open registration URL.
2. Submit participant details.
3. Supabase validates the request and inserts the participant.
4. A district-prefixed Bib such as `PUN-000001` is returned.
5. Open the dashboard.
6. Dashboard polls aggregate statistics every 3 seconds, so the count rises after registration.
7. Open Admin to explain the prepared volunteer permission model.
8. Next milestone: implement Auth so an admin can create/activate district volunteers.

## Deployment mapping

- `register.mahamarathon.co.in` → registration interface
- `dashboard.mahamarathon.co.in` → dashboard interface
- `admin.mahamarathon.co.in` → administration interface
- One GitHub repository
- One Vercel project for the demo
- One Supabase project/database
- One GoDaddy-managed root domain
