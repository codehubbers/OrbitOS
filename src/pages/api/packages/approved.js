// src/pages/api/packages/approved.js

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Fetching from repo:', process.env.ORBIT_PACKAGES_REPO);
    const response = await fetch(
      `https://api.github.com/repos/${process.env.ORBIT_PACKAGES_REPO}/contents`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      },
    );

    if (!response.ok) {
      console.error(
        'GitHub API error:',
        response.status,
        await response.text(),
      );
      throw new Error('Failed to fetch packages');
    }

    const folders = await response.json();
    console.log(
      'Found folders:',
      folders.map((f) => f.name),
    );
    const packages = [];

    for (const folder of folders.filter((item) => item.type === 'dir')) {
      try {
        console.log(`Processing folder: ${folder.name}`);
        // Get orbit.lock.json
        const lockResponse = await fetch(
          `https://api.github.com/repos/${process.env.ORBIT_PACKAGES_REPO}/contents/${folder.name}/orbit.lock.json`,
          {
            headers: {
              Authorization: `token ${process.env.GITHUB_TOKEN}`,
              Accept: 'application/vnd.github.v3+json',
            },
          },
        );

        if (lockResponse.ok) {
          const lockFile = await lockResponse.json();
          const lockData = JSON.parse(
            Buffer.from(lockFile.content, 'base64').toString(),
          );
          console.log(`Lock data for ${folder.name}:`, lockData);

          if (lockData.signature === 'orbit-signed') {
            packages.push({
              id: folder.name,
              manifest: lockData.manifest,
              signature: lockData.signature,
              downloadUrl: lockData.downloadUrl,
            });
            console.log(`Added package: ${folder.name}`);
          } else {
            console.log(`Package ${folder.name} not signed properly`);
          }
        } else {
          console.log(
            `No orbit.lock.json found for ${folder.name}, status:`,
            lockResponse.status,
          );
          console.log(`Response:`, await lockResponse.text());
        }
      } catch (error) {
        console.error(`Failed to process package ${folder.name}:`, error);
      }
    }

    console.log('Final packages:', packages);
    res.status(200).json(packages);
  } catch (error) {
    console.error('Error fetching approved packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
}
