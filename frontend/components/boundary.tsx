'use client';
/* If the 3D scene ever throws (e.g. GPU/driver/three version issue),
   degrade to the fallback UI instead of a dead page. */
import { Component, type ReactNode } from 'react';

export default class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode }, { broken: boolean }
> {
  state = { broken: false };
  static getDerivedStateFromError() { return { broken: true }; }
  componentDidCatch(err: unknown) { console.error('3D scene crashed, using fallback:', err); }
  render() { return this.state.broken ? this.props.fallback : this.props.children; }
}
