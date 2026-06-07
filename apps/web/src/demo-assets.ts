import brokenDemoYamlRaw from '../../../examples/screenplay-broken.yaml?raw';
import stableDemoYamlRaw from '../../../examples/screenplay-sample.yaml?raw';
import demoNovelTextRaw from '../../../examples/novel-sample.md?raw';

export const demoRoutePath = '/demo';
export const demoNovelText = demoNovelTextRaw.trimEnd();
export const stableDemoYaml = stableDemoYamlRaw.trimEnd();
export const brokenDemoYaml = brokenDemoYamlRaw.trimEnd();

export function isDemoRoutePath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return normalized === demoRoutePath;
}
