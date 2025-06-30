# Klyro Frontend

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## AIR Credentials Configuration

This project integrates with AIR credentials for verifiable developer credentials using the AIR Kit environment configuration. To enable AIR credential features, you need to configure the following environment variables:

### Frontend Environment Variables (.env.local)

```bash
# AIR Build Environment (STAGING or SANDBOX)
NEXT_PUBLIC_AIR_BUILD_ENV=SANDBOX

# AIR Issuer Configuration
NEXT_PUBLIC_AIR_ISSUER_DID=your_issuer_did_here
NEXT_PUBLIC_AIR_ISSUER_API_KEY=your_issuer_api_key_here
NEXT_PUBLIC_AIR_CREDENTIAL_ID=your_credential_id_here

# AIR Verifier Configuration  
NEXT_PUBLIC_AIR_VERIFIER_DID=your_verifier_did_here
NEXT_PUBLIC_AIR_VERIFIER_API_KEY=your_verifier_api_key_here
NEXT_PUBLIC_AIR_PROGRAM_ID=your_program_id_here

# AIR Partner Configuration
NEXT_PUBLIC_AIR_PARTNER_ID=your_partner_id_here

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Frontend URL for KlyroGate links (set this for deployment)
NEXT_PUBLIC_FRONTEND_URL=https://yourdomain.com
```

### Backend Environment Variables (.env)

```bash
# AIR Build Environment (STAGING or SANDBOX)
AIR_BUILD_ENV=SANDBOX

# AIR Issuer Configuration
AIR_ISSUER_DID=your_issuer_did_here
AIR_ISSUER_API_KEY=your_issuer_api_key_here
AIR_CREDENTIAL_ID=your_credential_id_here
```

### Environment Configuration

The application uses AIR Kit's environment configuration system:

- **SANDBOX**: Development environment with sandbox URLs
  - Widget URL: `https://credential-widget.sandbox.air3.com`
  - API URL: `https://credential.api.sandbox.air3.com`

- **STAGING**: Staging environment with test URLs
  - Widget URL: `https://credential-widget.test.air3.com`
  - API URL: `https://credential.api.test.air3.com`

The appropriate URLs are automatically selected based on the `AIR_BUILD_ENV` environment variable.

### Getting AIR Credentials

1. Sign up for AIR credentials at [AIR3.com](https://air3.com)
2. Create an issuer DID and get your API keys
3. Create a verifier DID for credential verification
4. Configure your credential schema (Klyro uses a developer scoring schema)
5. Get your partner ID from the AIR dashboard

### Features

- **Automatic Credential Issuing**: Credentials are automatically issued when users complete their Klyro profiles
- **KlyroGate Verification**: Custom verification gates for events and organizations
- **Real-time Verification**: Instant credential verification using AIR wallet
- **Credential Status Tracking**: Track issued, verified, and revoked credentials
- **Environment-based Configuration**: Automatic URL selection based on build environment

# Developer Social Graph

This component visualizes connections between developers in a force-directed graph, showing relationships based on shared skills and blockchain experience.

## Features

- **Interactive Force-Directed Graph**: Visualizes developer connections with physics-based animations
- **Filtering System**: Filter developers by skills, blockchain experience, and minimum score
- **Developer Details Panel**: View detailed information about selected developers
- **Connection Highlighting**: Hover over nodes to see direct connections
- **Developer Circle**: See all developers connected to the selected developer
- **Responsive Design**: Works on all screen sizes

## Technologies Used

- **Next.js**: React framework
- **react-force-graph**: Force-directed graph visualization
- **TypeScript**: Type-safe JavaScript
- **TailwindCSS**: Utility-first CSS framework
- **Shadcn UI**: Component library
- **AIR Kit**: AIR credentials environment configuration

## Usage

The social graph is currently implemented in the `/kaito` route. Visit this route to see the visualization in action.

### Running the Project

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

### How It Works

The graph connects developers based on:

1. **Shared Skills**: Developers who share programming languages or technologies are connected
2. **Shared Blockchain Experience**: Developers who work on the same blockchains are connected

The strength of connections is based on the number of shared skills or chains.

### Filtering

Use the filters panel to:

- Select specific skills to display only developers with those skills
- Select specific blockchains to display only developers with experience on those chains
- Set a minimum developer score threshold

## Future Improvements

- Add global search for finding specific developers
- Implement 3D visualization option
- Add more connection types (projects, organizations, etc.)
- Optimize performance for larger datasets
- Add animation effects for graph transitions
