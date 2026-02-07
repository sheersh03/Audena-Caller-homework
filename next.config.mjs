/** @type {import('next').NextConfig} */
// Standalone is for Docker; Netlify uses its own Next.js runtime
const nextConfig = {
  output: process.env.NETLIFY ? undefined : "standalone",
};
export default nextConfig;
