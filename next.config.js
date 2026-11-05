/** @type {import('next').NextConfig} */
const fs = require('fs')
const path = require('path')

// Normalize permission errors (EPERM / EACCES) on files outside the project root
// into ENOENT ("not found") so tools like Browserslist, PostCSS, and Webpack
// probing parent directories do not fail with fatal permissions errors.
const projectRoot = path.resolve(__dirname)
function sanitizeOutsideAccess(targetPath, err) {
  if (
    err &&
    (err.code === 'EPERM' || err.code === 'EACCES') &&
    typeof targetPath === 'string' &&
    !targetPath.startsWith(projectRoot)
  ) {
    const enoent = new Error(`ENOENT: no such file or directory, stat '${targetPath}'`)
    enoent.code = 'ENOENT'
    enoent.errno = -2
    enoent.syscall = err.syscall || 'stat'
    enoent.path = targetPath
    return enoent
  }
  return err
}

const origStat = fs.stat
fs.stat = function (p, ...args) {
  const cb = args[args.length - 1]
  if (typeof cb === 'function') {
    args[args.length - 1] = (err, stats) => cb(sanitizeOutsideAccess(p, err), stats)
  }
  return origStat.apply(this, [p, ...args])
}

const origStatSync = fs.statSync
fs.statSync = function (p, ...args) {
  try {
    return origStatSync.apply(this, [p, ...args])
  } catch (err) {
    throw sanitizeOutsideAccess(p, err)
  }
}

const origLstat = fs.lstat
fs.lstat = function (p, ...args) {
  const cb = args[args.length - 1]
  if (typeof cb === 'function') {
    args[args.length - 1] = (err, stats) => cb(sanitizeOutsideAccess(p, err), stats)
  }
  return origLstat.apply(this, [p, ...args])
}

const origLstatSync = fs.lstatSync
fs.lstatSync = function (p, ...args) {
  try {
    return origLstatSync.apply(this, [p, ...args])
  } catch (err) {
    throw sanitizeOutsideAccess(p, err)
  }
}

if (fs.promises) {
  const origPStat = fs.promises.stat
  fs.promises.stat = async function (p, ...args) {
    try {
      return await origPStat.apply(this, [p, ...args])
    } catch (err) {
      throw sanitizeOutsideAccess(p, err)
    }
  }

  const origPLstat = fs.promises.lstat
  fs.promises.lstat = async function (p, ...args) {
    try {
      return await origPLstat.apply(this, [p, ...args])
    } catch (err) {
      throw sanitizeOutsideAccess(p, err)
    }
  }
}

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['frontend', 'backend', 'shared'],
  experimental: {
    outputFileTracingRoot: path.join(__dirname),
    serverComponentsExternalPackages: ['pg', 'bcryptjs'],
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@frontend': path.resolve(__dirname, 'frontend'),
      '@backend': path.resolve(__dirname, 'backend'),
      '@shared': path.resolve(__dirname, 'shared'),
    }
    if (config.cache) {
      delete config.cache.buildDependencies
    }
    config.snapshot = {
      ...(config.snapshot || {}),
      resolveBuildDependencies: { hash: false, timestamp: false },
      buildDependencies: { hash: false, timestamp: false },
    }
    return config
  },
}

module.exports = nextConfig
