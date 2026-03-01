import React from "react";
import { render, screen } from "@testing-library/react";
import AvatarFigure from "../pages/AvatarFigure";

const baseAvatar = {
  name: "Alex",
  gender: "male",
  role: "Technical Interviewer",
  color: "#4f9eff"
};

const animalAvatar = {
  name: "Luna",
  species: "animal",
  role: "Confidence Coach",
  avatar: "🦉",
  color: "#9f7aea"
};

const foxAvatar = {
  name: "Rex",
  species: "animal",
  role: "Behavior Mentor (Fox)",
  avatar: "🦊",
  color: "#ed8936"
};

const pandaAvatar = {
  name: "Coco",
  species: "animal",
  role: "Communication Coach (Panda)",
  avatar: "🐼",
  color: "#38b2ac"
};

describe("AvatarFigure posture", () => {
  test("uses idle posture class by default", () => {
    const { container } = render(<AvatarFigure avatar={baseAvatar} isSpeaking={false} />);
    expect(container.querySelector(".avatar-figure-wrapper.avatar-idle")).toBeInTheDocument();
  });

  test("uses speaking posture class and shows speaking ring when speaking", () => {
    const { container } = render(<AvatarFigure avatar={baseAvatar} isSpeaking={true} posture="thinking" />);
    expect(container.querySelector(".avatar-figure-wrapper.avatar-speaking")).toBeInTheDocument();
    expect(container.querySelector(".avatar-speak-ring")).toBeInTheDocument();
  });

  test("uses requested posture class when not speaking", () => {
    const { container, rerender } = render(
      <AvatarFigure avatar={baseAvatar} isSpeaking={false} posture="thinking" />
    );
    expect(container.querySelector(".avatar-figure-wrapper.avatar-thinking")).toBeInTheDocument();

    rerender(<AvatarFigure avatar={baseAvatar} isSpeaking={false} posture="nodding" />);
    expect(container.querySelector(".avatar-figure-wrapper.avatar-nodding")).toBeInTheDocument();
  });

  test("renders accessible avatar label", () => {
    render(<AvatarFigure avatar={baseAvatar} isSpeaking={false} />);
    expect(screen.getByLabelText(/alex avatar/i)).toBeInTheDocument();
  });

  test("renders enhanced animal avatar structure with listening posture", () => {
    const { container } = render(
      <AvatarFigure avatar={animalAvatar} isSpeaking={false} posture="listening" />
    );

    expect(screen.getByLabelText(/luna avatar/i)).toBeInTheDocument();
    expect(container.querySelector(".avatar-figure-wrapper.avatar-listening")).toBeInTheDocument();
    expect(container.querySelector(".animal-ears")).toBeInTheDocument();
    expect(container.querySelector(".animal-tail")).toBeInTheDocument();
    expect(container.querySelector(".animal-face .animal-eye.left")).toBeInTheDocument();
    expect(container.querySelector(".avatar-figure-wrapper.animal-personality-calm")).toBeInTheDocument();
  });

  test("assigns distinct personality classes for fox and panda avatars", () => {
    const { container, rerender } = render(
      <AvatarFigure avatar={foxAvatar} isSpeaking={false} posture="idle" />
    );

    expect(container.querySelector(".avatar-figure-wrapper.animal-personality-energetic")).toBeInTheDocument();

    rerender(<AvatarFigure avatar={pandaAvatar} isSpeaking={false} posture="idle" />);
    expect(container.querySelector(".avatar-figure-wrapper.animal-personality-gentle")).toBeInTheDocument();
  });
});
