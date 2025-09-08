import { siteConfig } from '@config'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { AnimatePresence, m } from 'motion/react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { injectConfig } from '~/config'
import { clsxm } from '~/lib/cn'
import { Spring } from '~/lib/spring'
import type { PhotoManifest } from '~/types/photo'

interface SharePanelProps {
  photo: PhotoManifest
  trigger: React.ReactNode
  blobSrc?: string
}

interface ShareOption {
  id: string
  label: string
  icon: string
  action: () => Promise<void> | void
  color?: string
  bgColor?: string
}

interface SocialShareOption {
  id: string
  label: string
  icon: string
  url: string
  color: string
  bgColor: string
}

export const SharePanel = ({ photo, trigger, blobSrc }: SharePanelProps) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  // 社交媒体分享选项
  // 图标网站连接 https://icon-sets.iconify.design/mingcute/
  const socialOptions: SocialShareOption[] = [
    {
      id: 'twitter',
      label: 'Twitter',
      icon: 'i-mingcute-twitter-fill',
      url: 'https://twitter.com/intent/tweet?text={text}&url={url}',
      color: 'text-white',
      bgColor: 'bg-sky-500',
    },
    // {
    //   id: 'facebook',
    //   label: 'Facebook',
    //   icon: 'i-mingcute-facebook-line',
    //   url: 'https://www.facebook.com/sharer/sharer.php?u={url}',
    //   color: 'text-white',
    //   bgColor: 'bg-[#1877F2]',
    // },
    {
      id: 'telegram',
      label: 'Telegram',
      icon: 'i-mingcute-telegram-line',
      url: 'https://t.me/share/url?url={url}&text={text}',
      color: 'text-white',
      bgColor: 'bg-[#0088CC]',
    },
    {
      id: 'weibo',
      label: t('photo.share.weibo'),
      icon: 'i-mingcute-weibo-line',
      url: 'https://service.weibo.com/share/share.php?url={url}&title={text}',
      color: 'text-white',
      // bgColor: 'bg-[#E6162D]',
      bgColor: 'bg-[#ff8200]',
    },
    {
      id: 'bilibili',
      label: t('tmt.bilibili'),
      icon: 'i-mingcute-bilibili-line',
      url: 'https://t.bilibili.com/h5/dynamic/specify?content={text}&from=pc&type=text',
      color: 'text-white',
      // bgColor: 'bg-[#ff5588]',
      bgColor: 'bg-[#00aeec]',
    },
    {
      id: 'douyin',
      label: t('tmt.douyin'),
      icon: 'i-mingcute-tiktok-fill',
      url: 'https://www.douyin.com/share/video?text={text}&url={url}',
      color: 'text-white',
      bgColor: 'bg-[#000000]',
    },
    {
      id: 'xiaohongshu',
      label: t('tmt.xiaohongshu'),
      icon: 'i-mingcute-heart-line',
      url: 'https://www.xiaohongshu.com/shared?title={text}&description={text}&url={url}',
      color: 'text-white',
      bgColor: 'bg-[#bf1b31]',
    },
  ]

  const handleNativeShare = useCallback(async () => {
    const shareUrl = window.location.href
    const shareTitle = photo.title || t('photo.share.default.title')
    const shareText = t('photo.share.text', { title: shareTitle })

    try {
      // 优先使用 blobSrc（转换后的图片），如果没有则使用 originalUrl
      const imageUrl = blobSrc || photo.originalUrl
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const file = new File([blob], `${photo.title || 'photo'}.jpg`, {
        type: blob.type || 'image/jpeg',
      })

      // 检查是否支持文件分享
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
          files: [file],
        })
      } else {
        // 不支持文件分享，只分享链接
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
      }
      setIsOpen(false)
    } catch {
      // 如果分享失败，复制链接
      await navigator.clipboard.writeText(shareUrl)
      toast.success(t('photo.share.link.copied'))
      setIsOpen(false)
    }
  }, [photo.title, blobSrc, photo.originalUrl, t])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success(t('photo.share.link.copied'))
      setIsOpen(false)
    } catch {
      toast.error(t('photo.share.copy.failed'))
    }
  }, [t])

  const handleCopyEmbedCode = useCallback(async () => {
    try {
      const embedCode = `<iframe
  src="${siteConfig.url}/share/iframe?id=${photo.id}"
  height="500"
  className="w-full"
  allowTransparency
  sandbox="allow-scripts allow-same-origin allow-popups"
/>`
      await navigator.clipboard.writeText(embedCode)
      toast.success(t('photo.share.embed.copied'))
      setIsOpen(false)
    } catch {
      toast.error(t('photo.share.copy.failed'))
    }
  }, [photo.id, t])

  const handleSocialShare = useCallback(
    (url: string) => {
      const shareUrl = encodeURIComponent(window.location.href)
      const defaultTitle = t('photo.share.default.title')
      const shareTitle = encodeURIComponent(photo.title || defaultTitle)
      const shareText = encodeURIComponent(
        t('photo.share.text', { title: photo.title || defaultTitle }),
      )

      const finalUrl = url
        .replace('{url}', shareUrl)
        .replace('{title}', shareTitle)
        .replace('{text}', shareText)

      window.open(finalUrl, '_blank', 'width=600,height=400')
      setIsOpen(false)
    },
    [photo.title, t],
  )

  // 功能选项
  const actionOptions: ShareOption[] = [
    ...(typeof navigator !== 'undefined' && 'share' in navigator
      ? [
          {
            id: 'native-share',
            label: t('photo.share.system'),
            icon: 'i-mingcute-share-2-line',
            action: handleNativeShare,
          },
        ]
      : []),
    {
      id: 'copy-link',
      label: t('photo.share.copy.link'),
      icon: 'i-mingcute-link-line',
      action: handleCopyLink,
    },
    {
      id: 'copy-embed',
      label: t('photo.share.embed.code'),
      icon: 'i-mingcute-code-line',
      action: handleCopyEmbedCode,
      color: 'text-purple-500',
    },
  ]

  return (
    <DropdownMenuPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuPrimitive.Trigger asChild>
        {trigger}
      </DropdownMenuPrimitive.Trigger>

      <AnimatePresence>
        {isOpen && (
          <DropdownMenuPrimitive.Portal forceMount>
            <DropdownMenuPrimitive.Content
              align="end"
              sideOffset={8}
              className="z-[10000] min-w-[280px] will-change-[opacity,transform]"
              asChild
            >
              <m.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={Spring.presets.smooth}
                className={clsxm(
                  'rounded-2xl border border-border/10 p-4',
                  'bg-material-ultra-thick backdrop-blur-[70px]',
                  'shadow-2xl dark:shadow-black/20 light:shadow-white/20',
                  'dark:shadow-black/50 light:shadow-white/50',
                )}
              >
                {/* 标题区域 */}
                <div className="mb-4 text-center">
                  <h3 className="text-text font-semibold">
                    {t('photo.share.title')}
                  </h3>
                  {photo.title && (
                    <p className="text-text-secondary mt-1 line-clamp-1 text-sm">
                      {photo.title}
                    </p>
                  )}
                </div>

                {/* 社交媒体分享 - 第一排 */}
                <div className="mb-6">
                  <div className="mb-3">
                    <h4 className="text-text-secondary text-xs font-medium tracking-wide uppercase">
                      {t('photo.share.social.media')}
                    </h4>
                  </div>
                  <div className="flex gap-6 px-2">
                    {socialOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className="group flex cursor-pointer flex-col items-center gap-2"
                        onClick={() => handleSocialShare(option.url)}
                      >
                        <div
                          className={clsxm(
                            'flex size-12 items-center justify-center rounded-full transition-all duration-200',
                            option.bgColor,
                            'group-hover:scale-110 group-active:scale-95',
                            'shadow-lg',
                          )}
                        >
                          {option.id === 'xiaohongshu' ? (
                            <svg
                              viewBox="0 0 1700 1024"
                              width="30"
                              height="20"
                              fill={
                                option.color === 'text-white'
                                  ? '#ffffff'
                                  : '#000000'
                              }
                            >
                              <path d="M1556.58367989 666.84618125c-29.0770875 60.29219619-60.07839434 76.86185977-124.32592969 66.70625977-41.2638082-6.52096406-63.81993076-30.68060362-69.91329112-78.89298047 24.90794648 0 49.49518974-0.64140645 73.97553165 0.21380273 16.46276308 0.64140645 23.94583682-4.91744883 23.30443036-22.23542021-0.96210967-25.01484698 0.21380185-50.24349668-0.64140644-75.25834453-0.74830781-20.95260732-12.1867207-34.63594278-33.56693174-35.06354649-42.9742248-0.96210967-85.94844961-0.32070323-133.0918163-0.32070322v212.84000508h-95.67644591V523.38496221h-96.53165507v-98.34897218h93.85912793v-83.48972607h-62.32331602v-96.10404961c20.52500273-0.96210967 40.19479717-2.03111982 63.28542569-3.10013086v-33.35312987H1291.36215693c-3.7415373 26.83216494 6.7347668 35.49115107 34.63594278 35.91875477 74.082433 1.17591152 113.10131865 42.86732432 114.49103203 117.27045968 0.42760459 20.41810224 0.10690137 40.83620362 0.10690136 63.28542656 59.8645916-2.77942763 96.74545693 21.91471699 115.98764678 72.69271875v168.68986787zM1292.00356338 336.94951924c0 29.39779073-1.17591152 51.31250771 0.74830781 72.9065206 0.53450508 5.55885527 10.79700645 14.43164238 16.56966358 14.43164239 11.65221562 0.10690137 33.03242666-3.7415373 33.46003036-7.91067744 2.45872441-22.3423207 3.42083408-46.39505888-3.20703134-67.34766622-2.24492256-7.26927188-27.47357138-7.37617324-47.57097041-12.07981933zM357.3676206 208.88205224c-0.21380185 146.34754717-0.10690137 292.8019957-0.85520829 439.14954287-0.32070323 62.64401924-39.55339072 96.10405049-98.6696754 86.26915284-38.69818242-6.41406357-59.65078974-32.60482208-61.14740449-78.7860791h64.24753448V208.98895362c32.17721836-0.10690137 64.35443672-0.10690137 96.4247537-0.10690138zM767.11937276 208.88205224c-23.62513359 47.14336582-50.02969482 93.11082099-66.81316026 137.90236378 39.33958886-2.24492256 74.61693808-4.27604238 116.73595372-6.7347668-22.23542021 44.89844414-42.01211513 84.6656376-61.78881094 124.53973154-2.67252627 5.34505254-5.23815205 10.90390781-7.91067833 16.24896124-20.73880547 41.58451143-20.63190411 41.69141191 25.33555107 42.9742248 4.81054747 0.10690137 9.51419443 0.74830781 18.28008018 1.49661474-12.93502763 25.33555019-24.26654003 48.42617871-36.45325986 71.08920264-2.03111982 3.7415373-7.48307373 8.01757969-11.3315124 8.01757968-33.99453633-0.10690137-68.30977588 1.06901016-102.09050948-2.67252626-24.4803419-2.77942763-33.78073448-21.27331055-24.26654003-44.57774092 11.65221562-28.75638428 25.44245156-56.65756026 38.2705787-84.87943946 4.38294375-9.72799629 8.76588662-19.45599258 15.28685069-33.88763495-18.9214875 0-32.60482208 0.42760459-46.28815752-0.10690138-40.62240176-1.38971338-54.09193448-19.45599258-37.41536953-56.33685703 26.40456123-58.36797685 55.90925244-115.4531417 84.02423027-173.07281162h96.42475372zM62.10690137 576.40788653c6.09336036-33.78073448 13.79023594-67.4545667 17.85247646-101.44910304 5.13125068-42.76042295 7.16237051-85.84154912 10.69010508-130.73999237h101.44910391c-17.21107002 115.98764678 3.42083408 238.81696172-72.58581827 345.50421679-20.31120088-35.70495293-38.91198516-68.52357773-57.51276855-101.34220254 0.10690137-3.84843779 0.10690137-7.91067832 0.10690137-11.97291885zM1556.58367989 305.30680596c-21.70091426 37.73607276-56.01615381 38.69818242-92.79011778 32.92552529-11.01080918-47.89167363-3.10013086-79.32058418 22.44922207-90.97279893 23.83893545-10.90390781 45.64675107-2.24492256 70.34089571 28.00807647v30.03919717z" />
                              <path d="M998.6670626 639.47951035c26.40456123 0 51.20560635 0.53450508 76.00665146-0.21380186 15.60755391-0.42760459 20.41810224 5.98645898 21.38021192 21.27331055 4.81054747 76.11355283 5.23815205 76.11355283-71.73060996 76.11355284H752.36702715c16.8903668-33.35312989 30.57370224-62.64401924 46.7157621-90.43829473 2.99322949-5.23815205 16.03515849-6.20026172 24.4803419-6.41406358 23.94583682-0.8552083 47.998575-0.32070323 74.29623487-0.32070321V341.33246211h-61.46810772v-94.60743575h223.10250556v93.11082101h-60.93360263c0.10690137 100.59389472 0.10690137 198.19455996 0.10690137 299.64366298zM425.89119834 343.36358281h95.03504033c4.5967456 58.68868008 2.56562578 117.80496474 15.28685068 173.6073167 14.96614834 65.3165455-8.87278799 115.88074629-39.76719345 167.40705499-46.18125703-40.4085999-71.30300537-161.42059599-70.55469756-341.01437169zM597.03979062 638.30359883h153.93752227c-17.21107002 33.6738331-30.7875041 61.1474045-45.64675107 87.97957031-2.77942763 4.91744883-10.90390781 9.62109492-16.67656495 9.72799629-44.89844414 0.74830781-89.79688828 0.42760459-141.32319785 0.42760371 19.56289307-38.80508378 35.59805244-70.3408957 49.70899161-98.13517031z" />
                            </svg>
                          ) : (
                            <i
                              className={clsxm(
                                option.icon,
                                'size-5',
                                option.color,
                              )}
                            />
                          )}
                        </div>
                        <span className="text-text-secondary text-xs font-medium">
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 嵌入代码 - 第二排 */}
                {injectConfig.useNext && (
                  <div className="mb-6">
                    <div className="mb-3">
                      <h4 className="text-text-secondary text-xs font-medium tracking-wide uppercase">
                        {t('photo.share.embed.code')}
                      </h4>
                      <p className="text-text-tertiary mt-1 text-xs">
                        {t('photo.share.embed.description')}
                      </p>
                    </div>
                    <div className="relative">
                      <div className="bg-fill-secondary/50 border-border/10 rounded-lg border p-3">
                        <code className="text-text-secondary font-mono text-xs break-all whitespace-pre select-all">
                          {`<iframe
  src="${siteConfig.url.replace(/\/$/, '')}/share/iframe?id=${photo.id}"
  style="width: 100%; aspect-ratio: ${photo.width} / ${photo.height}"
  allowTransparency
  sandbox="allow-scripts allow-same-origin allow-popups"
/>`}
                        </code>
                      </div>
                      <button
                        type="button"
                        className={clsxm(
                          'absolute top-2 right-2 flex items-center justify-center',
                          'size-7 rounded-md bg-fill-tertiary/80 hover:bg-fill-tertiary backdrop-blur-3xl',
                          'transition-colors duration-200 group',
                        )}
                        onClick={handleCopyEmbedCode}
                      >
                        <i className="i-mingcute-copy-line text-text-secondary group-hover:text-text size-3.5 cursor-pointer" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 功能选项 - 第三排 */}
                <div>
                  <div className="mb-3">
                    <h4 className="text-text-secondary text-xs font-medium tracking-wide uppercase">
                      {t('photo.share.actions')}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {actionOptions
                      .filter((option) => option.id !== 'copy-embed')
                      .map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={clsxm(
                            'relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2',
                            'text-sm outline-none transition-all duration-200',
                            'hover:bg-fill-secondary/80 active:bg-fill-secondary',
                            'group',
                          )}
                          onClick={() => option.action()}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={clsxm(
                                'flex size-7 items-center justify-center rounded-full',
                                'bg-fill-tertiary/80 group-hover:bg-fill-tertiary',
                                'transition-colors duration-200',
                              )}
                            >
                              <i
                                className={clsxm(
                                  option.icon,
                                  'size-3.5',
                                  option.color || 'text-text-secondary',
                                )}
                              />
                            </div>
                            <span className="text-text text-xs font-medium">
                              {option.label}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </m.div>
            </DropdownMenuPrimitive.Content>
          </DropdownMenuPrimitive.Portal>
        )}
      </AnimatePresence>
    </DropdownMenuPrimitive.Root>
  )
}
