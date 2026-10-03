const getHealth = (req, res) => {
  const sourceCommit = process.env.SOURCE_COMMIT
    || process.env.RAILWAY_GIT_COMMIT_SHA
    || process.env.VERCEL_GIT_COMMIT_SHA
    || process.env.GITHUB_SHA
    || 'unknown';

  res.status(200).json({
    message: 'success',
    data: {
      status: 'ok',
      version: process.env.npm_package_version || '1.0.0',
      sourceCommit,
    },
  });
};

module.exports = { getHealth };
