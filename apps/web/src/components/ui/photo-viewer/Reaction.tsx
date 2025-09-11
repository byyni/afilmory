import { FluentEmoji, getEmoji } from '@lobehub/fluent-emoji'
import { produce } from 'immer'
import { AnimatePresence, m } from 'motion/react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { tv } from 'tailwind-variants'

import { client } from '~/lib/client'
import { clsxm } from '~/lib/cn'
import { Spring } from '~/lib/spring'

import { useAnalysis } from './hooks/useAnalysis'

const reactions = ['👍', '😍', '🔥', '👏', '🌟', '🙌'] as const

interface ReactionButtonProps {
  className?: string
  disabled?: boolean
  photoId: string
}

const reactionButton = tv({
  slots: {
    base: 'relative z-[2] ',
    reactionsContainer: [
      'flex items-center justify-center gap-2',
      'rounded-full dark:border-white/20 !dark:bg-black/70 light:border-black/20 !light:bg-white/70 p-2 shadow-2xl backdrop-blur-[70px]',
      'bg-gradient-to-br dark:from-white/20 dark:to-white/0 light:from-black/20 light:to-black/0',
      'select-none',
    ],
    reactionItem: [
      'relative flex size-10 items-center justify-center',
      'cursor-pointer text-xl',
    ],
  },
})

const emojiVariants = {
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: Spring.presets.snappy,
  },
}

export const ReactionButton = ({
  className,
  disabled = false,
  photoId,
}: ReactionButtonProps) => {
  const styles = reactionButton()
  const { t } = useTranslation()
  const handleReaction = useCallback(
    async (reaction: (typeof reactions)[number]) => {
      await client.actReaction({
        refKey: photoId,
        reaction,
      })
      toast.success(t('photo.reaction.success'))
    },
    [photoId, t],
  )
  const { data, mutate } = useAnalysis(photoId)
  const handleReactionClick = useCallback(
    (reaction: (typeof reactions)[number]) => {
      handleReaction(reaction).then(() => {
        mutate((data) => {
          return produce(data, (draft) => {
            if (!draft) return
            draft.data.reactions[reaction] =
              (draft.data.reactions[reaction] || 0) + 1
          })
        })
      })
    },
    [handleReaction, mutate],
  )

  const [currentAnimatingEmoji, setCurrentAnimatingEmoji] = useState<
    (typeof reactions)[number] | null
  >(null)

  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  return (
    <div className={clsxm(styles.base(), className)}>
      <m.div
        variants={emojiVariants}
        initial="open"
        animate="open"
        className={styles.reactionsContainer()}
      >
        {reactions.map((reaction, index) => (
          <m.button
            key={index}
            className={styles.reactionItem()}
            variants={emojiVariants}
            onClick={() => {
              if (animationTimeoutRef.current) {
                clearTimeout(animationTimeoutRef.current)
              }
              setCurrentAnimatingEmoji(reaction)
              handleReactionClick(reaction)
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            disabled={disabled}
          >
            <AnimatePresence>
              {currentAnimatingEmoji === reaction ? (
                <m.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0, transition: { duration: 0.3 } }}
                  transition={Spring.presets.snappy}
                  onAnimationComplete={() => {
                    if (animationTimeoutRef.current) {
                      clearTimeout(animationTimeoutRef.current)
                    }
                    animationTimeoutRef.current = setTimeout(() => {
                      setCurrentAnimatingEmoji(null)
                    }, 1000)
                  }}
                >
                  <FluentEmoji
                    cdn="aliyun"
                    emoji={getEmoji(reaction)!}
                    size={24}
                    type="anim"
                  />
                </m.span>
              ) : (
                <FluentEmoji
                  cdn="aliyun"
                  emoji={getEmoji(reaction)!}
                  size={24}
                  type="anim"
                />
              )}
            </AnimatePresence>
            {!!data?.data.reactions[reaction] && (
              <span className="bg-red/50 absolute top-0 right-0 rounded-full px-1.5 py-0.5 text-[8px] text-white tabular-nums backdrop-blur-2xl">
                {data.data.reactions[reaction]}
              </span>
            )}
          </m.button>
        ))}
      </m.div>
    </div>
  )
}
