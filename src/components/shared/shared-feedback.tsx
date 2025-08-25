"use client";

import { ButtonPrimitive } from "../ui/button";

type Props = {};

export const SharedFeedback = ({}: Props) => {
  return (
    <div className="absolute bottom-0 left-0">
      <ButtonPrimitive
        className="font-semibold cursor-pointer hover:underline"
        data-tally-open="3NapOQ"
        data-tally-width="500"
        data-tally-align-left="1"
        data-tally-emoji-text="👋"
        data-tally-emoji-animation="wave"
        data-tally-form-events-forwarding="1"
      >
        Share Feedback ☺️
      </ButtonPrimitive>
    </div>
  );
};
