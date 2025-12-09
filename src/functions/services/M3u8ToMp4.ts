import { exec } from 'child_process';
import { mkdirSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

export default async ({ url, name }: { url: string; name: string }): Promise<string> => {
  if (!url || url.trim() === "") return "invalid url";

  let destinationDir: string = join(process.env.HOME || '', 'Videos', 'kick-dlp');

  mkdirSync(destinationDir, { recursive: true });

  let output: string = join(destinationDir, `${name}.mp4`);

  if (existsSync(output)) unlinkSync(output);

  return new Promise((resolve, reject) => {
    let process = exec(`ffmpeg -i "${url}" -c copy -bsf:a aac_adtstoasc -movflags +faststart "${output}" 2>&1`, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        return reject(`Error executing command: ${error.message}`);
      };
      
      if (stderr) {
        return reject(`ffmpeg error: ${stderr.trim()}`);
      };
      
      resolve(`Download complete! The file is located at: ${output}`);
      
      console.log(`Download complete! The file is located at: ${output}`);
    });

    process.stdout?.on('data', (data) => {
      console.log(data.toString());
    });

    process.stderr?.on('data', (data) => {
      console.error(data.toString());
    });

    process.on('error', (error) => {
      reject(`Failed to start ffmpeg: ${error.message}`);
    });
  });
};