import React from "react";
import {
  State as GestureState,
  PanGestureHandler
} from "react-native-gesture-handler";
import Animated, {
  Clock,
  Value,
  and,
  block,
  clockRunning,
  cond,
  debug,
  eq,
  interpolate,
  not,
  set,
  useCode
} from "react-native-reanimated";
import {
  bInterpolate,
  clamp,
  onGestureEvent,
  snapPoint,
  timing
} from "react-native-redash";

import { State, alpha, perspective } from "./Constants";
import Content, { width } from "./Content";

const MIN = -width * Math.tan(alpha);
const MAX = 0;
const PADDING = 100;

interface ProfileProps {
  state: Animated.Value<State>;
}

export default ({ state }: ProfileProps) => {
  const clock = new Clock();
  const transition = new Value(0);
  const velocityX = new Value(0);
  const translationX = new Value(0);
  const gestureState = new Value(GestureState.UNDETERMINED);
  const x = clamp(translationX, MIN, MAX + PADDING);
  const translateX = bInterpolate(transition, MIN, 0);
  const opacity = bInterpolate(transition, 0.5, 1);
  const scale = bInterpolate(transition, 1, 0.9);
  const rotateY = bInterpolate(transition, alpha, 0);
  const gestureHandler = onGestureEvent({
    translationX,
    velocityX,
    state: gestureState
  });
  const gestureTransition = interpolate(x, {
    inputRange: [MIN, MAX],
    outputRange: [0, 1]
  });
  const snapTo = eq(snapPoint(x, velocityX, [MIN, MAX]), 0);
  useCode(
    () =>
      block([
        cond(eq(gestureState, GestureState.BEGAN), [
          set(state, State.DRAGGING)
        ]),
        cond(
          cond(eq(state, State.DRAGGING), eq(gestureState, GestureState.END)),
          [set(state, State.SNAPPING)]
        ),
        cond(eq(state, State.OPENING), [
          set(transition, timing({ from: 0, to: 1 }))
        ]),
        cond(eq(state, State.CLOSING), set(transition, 0)),
        cond(eq(state, State.SNAPPING), [
          set(
            transition,
            timing({ clock, from: gestureTransition, to: snapTo })
          ),
          cond(not(clockRunning(clock)), [
            set(state, cond(snapTo, State.RESTING, State.CLOSING))
          ])
        ]),
        cond(eq(state, State.DRAGGING), [set(transition, gestureTransition)])
      ]),
    [clock, gestureState, gestureTransition, snapTo, state, transition]
  );
  return (
    <PanGestureHandler minDist={0} {...gestureHandler}>
      <Animated.View
        style={{
          opacity,
          transform: [
            perspective,
            { translateX },
            { translateX: -width / 2 },
            { rotateY },
            { translateX: width / 2 },
            { scale }
          ]
        }}
      >
        <Content />
      </Animated.View>
    </PanGestureHandler>
  );
};
