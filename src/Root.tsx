import React from "react";
import { Composition } from "remotion";
import { Hero } from "./Hero";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Hero"
      component={Hero}
      durationInFrames={180}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
