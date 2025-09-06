import path from 'node:path'

import { env } from '@env'

import type { PhotoInfo, PickedExif } from '../types/photo.js'
import { getGlobalLoggers } from './logger-adapter.js'

// 从文件名提取照片信息
export function extractPhotoInfo(
  key: string,
  exifData?: PickedExif | null,
): PhotoInfo {
  const log = getGlobalLoggers().image

  log.info(`提取照片信息：${key}`)

  const fileName = path.basename(key, path.extname(key))

  // 尝试从文件名解析信息，格式示例："2024-01-15_城市夜景_1250views"
  let dateTaken = new Date().toISOString()
  let tags: string[] = []

  // 优先从 EXIF 数据中提取 XPKeywords 作为标签
  if (exifData?.XPKeywords && typeof exifData.XPKeywords === 'string') {
    tags = exifData.XPKeywords.split(';')
      .map((tag) => tag.trim())
      .filter((tag) => tag !== '')
    log.info(`从 EXIF XPKeywords 提取标签：[${tags.join(', ')}]`)
  } else {
    // 如果没有 XPKeywords，则从目录路径中提取 tags
    const dirPath = path.dirname(key)
    if (dirPath && dirPath !== '.' && dirPath !== '/') {
      // 移除前缀（如果有的话）
      let relativePath = dirPath
      if (env.S3_PREFIX && dirPath.startsWith(env.S3_PREFIX)) {
        relativePath = dirPath.slice(env.S3_PREFIX.length)
      }

      // 清理路径分隔符
      relativePath = relativePath.replaceAll(/^\/+|\/+$/g, '')

      if (relativePath) {
        // 分割路径并过滤空字符串
        const pathParts = relativePath
          .split('/')
          .filter((part) => part.trim() !== '')
        tags = pathParts.map((part) => part.trim())

        log.info(`从路径提取标签：[${tags.join(', ')}]`)
      }
    }
  }

  // 优先使用 EXIF 中的 DateTimeOriginal
  if (exifData?.DateTimeOriginal) {
    try {
      const dateTimeOriginal = new Date(exifData.DateTimeOriginal)

      // 如果是 Date 对象，直接使用
      if (dateTimeOriginal instanceof Date) {
        dateTaken = dateTimeOriginal.toISOString()
        log.info('使用 DateTimeOriginal 作为拍摄时间')
      } else {
        log?.warn(
          `未知的 DateTimeOriginal 类型：${typeof dateTimeOriginal}`,
          dateTimeOriginal,
        )
      }
    } catch (error) {
      log?.warn(
        `解析 EXIF DateTimeOriginal 失败：${exifData.DateTimeOriginal}`,
        error,
      )
    }
  } else if (exifData?.CreateDate) {
    try {
      const createDate = new Date(exifData.CreateDate)
      // 如果是 Date 对象，直接使用
      if (createDate instanceof Date) {
        dateTaken = createDate.toISOString()
        log.info(
          `${key}: 使用 EXIF CreateDate ${exifData?.CreateDate} 作为拍摄时间`,
        )
      } else {
        log?.warn(`未知的 CreateDate 类型：${typeof createDate}`, createDate)
      }
    } catch (error) {
      log?.warn(`解析 EXIF CreateDate 失败：${exifData.CreateDate}`, error)
    }
  } else {
    // 如果 EXIF 中没有日期，尝试从文件名解析
    const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/)
    if (dateMatch) {
      dateTaken = new Date(dateMatch[1]).toISOString()
      log.info(`从文件名提取拍摄时间：${dateMatch[1]}`)
    }
  }

  // 从 EXIF 数据中提取描述信息
  let description = ''
  if (exifData) {
    // 优先使用 XPTitle(标题)，其次是 XPComment(备注)，XPSubject(主题)， 最后是 ImageDescription
    if (exifData.XPTitle && typeof exifData.XPTitle === 'string') {
      description = exifData.XPTitle.trim()
    } else if (exifData.XPSubject && typeof exifData.XPSubject === 'string') {
      description = exifData.XPSubject.trim()
    } else if (exifData.XPComment && typeof exifData.XPComment === 'string') {
      description = exifData.XPComment.trim()
    } else if (
      exifData.ImageDescription &&
      typeof exifData.ImageDescription === 'string'
    ) {
      description = exifData.ImageDescription.trim()
    } else {
      // 如果没有可用的描述信息，使用文件名
      // description = fileName
      description = ''
    }
  }

  return {
    title: fileName,
    dateTaken,
    tags,
    description,
  }
}
