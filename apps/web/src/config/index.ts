import { merge } from 'es-toolkit/compat'

const defaultInjectConfig = {
  // useApi: false,
  // useNext: false,
  useApi: true,
  useNext: true,
}

export const injectConfig = merge(defaultInjectConfig, __CONFIG__)
