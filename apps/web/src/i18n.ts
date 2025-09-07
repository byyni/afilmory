import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { atom } from 'jotai'
import { initReactI18next } from 'react-i18next'

import { resources } from './@types/resources'
import { gallerySettingAtom } from './atoms/app'
import { jotaiStore } from './lib/jotai'

const i18n = i18next.createInstance()

// 初始化i18next并同步语言到gallerySettingAtom
const initializeI18n = async () => {
  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: {
        default: ['zh-CN'],
      },
      defaultNS: 'app',
      resources,
      // 配置存储，确保语言设置被保存
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
    })

  // 获取i18next当前使用的语言
  const currentLanguage = i18n.language

  // 同步语言到gallerySettingAtom
  const currentSettings = jotaiStore.get(gallerySettingAtom)
  jotaiStore.set(gallerySettingAtom, {
    ...currentSettings,
    language: currentLanguage as any, // 确保类型匹配
  })
}

// 立即初始化i18n
initializeI18n()

export const i18nAtom = atom(i18n)

export const getI18n = () => {
  return jotaiStore.get(i18nAtom)
}
