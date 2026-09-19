/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optional: uncomment to deploy as a static site (e.g. GitHub Pages).
  // output: "export",
  // basePath: "/your-repo-name",
  images: { unoptimized: true },
};

export default nextConfig;
