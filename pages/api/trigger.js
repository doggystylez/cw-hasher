import fetch from 'node-fetch';

async function triggerGitHubWorkflow(inputs, githubToken) {
  const { repo_name, commit_hash, ref_hash, docker_image, working_dir } = inputs;
  const owner = 'doggystylez';
  const repo = 'cw-hasher';
  const workflow_id = 'hasher.yml';

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `token ${githubToken}`,
    },
    body: JSON.stringify({
      ref: 'main',
      inputs: {
        repo_name,
        commit_hash,
        ref_hash,
        docker_image,
        working_dir,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`GitHub API responded with status: ${response.status}\nResponse body: ${errorBody}`);
  }

  return response.json();
}

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { repo_name, commit_hash, ref_hash, docker_image, working_dir } = req.body;

  if (!repo_name || !commit_hash || !ref_hash || !docker_image || !working_dir) {
    return res.status(400).send('Bad Request: Missing required parameters');
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return res.status(500).send('Internal Server Error: Missing GitHub token');
  }

  try {
    await triggerGitHubWorkflow({ repo_name, commit_hash, ref_hash, docker_image, working_dir }, githubToken);
    res.status(200).json({ status: 'Workflow dispatch triggered successfully' });
  } catch (error) {
    console.error('Error triggering GitHub workflow:', error);
    res.status(500).json({ status: 'Internal Server Error', message: error.message });
  }
};
