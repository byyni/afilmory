import { atom } from 'jotai'

import type { MainSupportedLanguages } from '../@types/constants'
import { isMobile } from '../hooks/useMobile'

export type GallerySortBy = 'date'
export type GallerySortOrder = 'asc' | 'desc'

export const gallerySettingAtom = atom({
  sortBy: 'date' as GallerySortBy,
  sortOrder: 'desc' as GallerySortOrder,
  selectedTags: [] as string[],
  selectedCameras: [] as string[], // Selected camera display names
  selectedLenses: [] as string[], // Selected lens display names
  selectedRatings: null as number | null, // Selected minimum rating threshold
  tagFilterMode: 'union' as 'union' | 'intersection', // Tag filtering logic mode
  tagSearchQuery: '' as string,
  cameraSearchQuery: '' as string, // Camera search query
  lensSearchQuery: '' as string, // Lens search query
  ratingSearchQuery: '' as string, // Rating search query
  isTagsPanelOpen: false as boolean,
  columns: isMobile() ? ('auto' as const) : 5, // 自定义列数，移动端使用auto，其他设备使用6
  language: 'zh-CN' as MainSupportedLanguages, // 默认语言设置
})

export const isExiftoolLoadedAtom = atom(false)
