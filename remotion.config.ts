import { Config } from "@remotion/cli/config";

// Use ANGLE + SwiftShader so WebGL works on machines without a GPU
// (including the Docker image this project ships with).
Config.setChromiumOpenGlRenderer("swangle");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
