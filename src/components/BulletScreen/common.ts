import BulletScreen from './BulletScreen';
export interface IOptionsProps {
  trackHeight: number;
  gap: string;
  animate: string;
  pauseOnHover: boolean;
  pauseOnClick: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  loopCount: string | number;
  duration: number | string;
  delay: number | string;
  direction: string;
  animateTimeFun: string;
  top?: number;
}
/** 弹幕默认配置 */
const defaultOptions: IOptionsProps = {
  // 跑道高度
  trackHeight: 50,
  // 弹幕之间的间距
  gap: '10px',
  animate: 'RightToLeft',
  pauseOnHover: false,
  pauseOnClick: true,
  // 开始方法
  onStart: undefined,
  // 结束方法
  onEnd: undefined,
  loopCount: 1,
  duration: 10,
  delay: 0,
  direction: 'normal',
  animateTimeFun: 'linear',
  top: undefined,
};
/**
 * 给弹幕容器增加支持弹幕的样式
 * 给html文件注入弹幕位移的动画
 */
const initBulletAnimate = (screen: HTMLElement | null) => {
  if (!screen) {
    return;
  }
  const style = document.createElement('style');
  // 弹幕容器宽度
  const width = screen.clientWidth;
  style.append(`@keyframes RightToLeft { 
    from {
      transform: translateX(${width}px); 
    }
    to { 
      transform: translateX(-100%); 
    }
  }`);
  document.head.appendChild(style);
};

/**
 *
 * @param opts
 * @returns 获取弹幕容器
 */
interface IGetContainerProps extends IOptionsProps {
  currScreen: BulletScreen;
}
/** 获取弹幕容器 */
const getContainer = ({
  currScreen,
  pauseOnHover,
  pauseOnClick,
  animate,
  loopCount,
  direction,
  delay,
  duration,
  animateTimeFun,
}: IGetContainerProps) => {
  // 创建单条弹幕的容器
  const bulletContainer = document.createElement('div');
  // 随机ID
  bulletContainer.id = Math.random().toString(36).substring(2);
  // 设置弹幕容器的初始样式
  bulletContainer.style.position = 'absolute';
  bulletContainer.style.left = '0';

  // https://developer.mozilla.org/zh-CN/docs/Web/CSS/animation
  //动画名称，默认前面设置的RightToLeft string
  bulletContainer.style.animationName = animate;
  // 动画循环次数 infinite无限次 1 一次 string|number
  bulletContainer.style.animationIterationCount = loopCount as string;
  // 动画延迟开始
  bulletContainer.style.animationDelay = (
    isNaN(delay as number) ? delay : `${delay}s`
  ) as string;
  // 是否反向播放 可以通过此值，实现从左到右
  bulletContainer.style.animationDirection = direction;
  // 一个动画周期的时长
  bulletContainer.style.animationDuration = (
    isNaN(duration as number) ? duration : `${duration}s`
  ) as string;
  // 动画周期的节奏
  bulletContainer.style.animationTimingFunction = animateTimeFun;
  // 隐藏
  if (currScreen.allHide) {
    bulletContainer.style.opacity = '0';
  }
  // 鼠标进入触发区域时（这里指当前div）触发暂停，离开时移动
  // pause on hover
  if (pauseOnHover) {
    // 动画暂停
    bulletContainer.addEventListener(
      'mouseenter',
      () => {
        bulletContainer.style.animationPlayState = 'paused';
      },
      false,
    );
    // 动画继续
    bulletContainer.addEventListener(
      'mouseleave',
      () => {
        if (!currScreen.allPaused && !bulletContainer.dataset.clicked) {
          bulletContainer.style.animationPlayState = 'running';
        }
      },
      false,
    );
  }
  //实现效果 点击暂停/移动
  // pause on lick
  if (pauseOnClick) {
    bulletContainer.addEventListener(
      'click',
      (evt) => {
        console.log(evt);
        let currStatus = bulletContainer.style.animationPlayState;
        if (currStatus === 'paused' && bulletContainer.dataset.clicked) {
          bulletContainer.dataset.clicked = '';
          bulletContainer.style.animationPlayState = 'running';
        } else {
          bulletContainer.dataset.clicked = 'true';
          bulletContainer.style.animationPlayState = 'paused';
        }
      },
      false,
    );
  }
  return bulletContainer;
};

export { defaultOptions, initBulletAnimate, getContainer };
