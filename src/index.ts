#!/usr/bin/env node
import GetM3u8File from "./functions/services/GetM3u8File";
import M3u8ToMp4 from "./functions/services/M3u8ToMp4";
import isJSON from "./functions/utils/isJSON";
import { exec } from "child_process";

let args = process.argv[2];

(async (url: string): Promise<void> => {
  exec("ffmpeg -version", async (error, stdout, stderr) => {
    if (error) {
      console.log("FFmpeg is not installed. Please install FFmpeg from https://ffmpeg.org/download.html and make sure it's in your PATH.");
      process.exit(1);
    }

    if (!url || url.trim() === "") return console.log("Invalid URL, command example: npx kick-dlp URL");

    let m3u8File: any = await GetM3u8File(url);

    if (isJSON(m3u8File)) {
      let fileUrl   = m3u8File.file;
      let fileName  = m3u8File.name;

      if (!fileUrl || !fileName) return console.log("Error fetching the VOD");

      await M3u8ToMp4({
        name: fileName,
        url: fileUrl,
      });
      
      return process.exit();
    } else {
      return console.log("Error fetching the VOD");
    };
  });
})(args ? args.toString() : "");