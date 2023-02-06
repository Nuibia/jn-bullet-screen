import React from 'react';
import { createRoot } from 'react-dom/client';
import { defaultOptions, getContainer, initBulletAnimate, IOptionsProps } from './helper';

export default class BulletScreen {
  /** 弹幕容器 */
  target: HTMLElement | null = null;
  /** 弹幕配置 */
  options = defaultOptions;
  /** 弹幕列表 */
  bullets: HTMLElement[] = [];
  /** 暂停 */
  allPaused = false;
  /** 隐藏 */
  allHide = false;
  /** 弹幕轨道
   * idle 闲置
   *  data 有值
   * running 上次添加弹幕状态 不可添加
   * 轨道逻辑 如果是闲置状态，优先塞入闲置状态轨道，如果没有闲置状态的，在再塞入data状态的，并且给当前push的弹幕轨道增加running状态，直到渲染完成后，将状态改为data状态
   */
  tracks: string[] = [];
  /** 暂停弹幕对列 */
  queues: any[] = [];
  /**
   *
   * @param ele 选择器字符串如 #id .class
   * @param opts
   */
  constructor(ele: string, opts: Partial<IOptionsProps>) {
    // 使用外部传进来的配置更新默认配置项
    this.options = Object.assign(this.options, opts);

    // 获取弹幕轨道高度
    const { trackHeight } = this.options;

    // 设置弹幕漂浮的容器
    if (typeof ele === 'string') {
      this.target = document.querySelector(ele);
      if (!this.target) {
        throw new Error('弹幕容器不存在');
      }
    } else {
      throw new Error('The display target of the barrage must be set');
    }

    // 获取弹幕容器的高度
    const { height } = this.target.getBoundingClientRect();

    // 初始化弹幕轨道，默认全部是空闲状态 idle 空闲标志
    this.tracks = new Array(Math.floor(height / trackHeight)).fill('idle');

    // 屏幕目标必须具备的CSS样式
    this.target.style.position = 'relative';

    // 插入css animation
    initBulletAnimate(this.target);
  }

  /** 获取当前发送弹幕的轨道下标
   * 期望规则如下：如果有空闲状态，优先空闲状态轨道
   * 如果没有空闲状态，优先弹道内弹幕*长度最小的弹道，且改弹道，不是上次发送的
   * 如果弹道内没有弹幕，则该弹道为idle 空闲状态
   * 如果该弹道刚刚发送了弹幕，则该弹道为running状态
   * 如果该弹道有弹幕，且不是刚刚发送弹幕，则该弹道为data状态
   */
  getTrackIndex(trackHeight: number) {
    // 空闲的轨道下标
    const readyIndex: number[] = [];
    let index = -1;

    // 优先取空闲状态的
    this.tracks.forEach((st, index) => {
      if (st === 'idle') {
        readyIndex.push(index);
      }
    });

    // 如果有空闲轨道
    if (readyIndex.length) {
      index = readyIndex[Math.floor(Math.random() * readyIndex.length)];
    }

    // 如果没有空闲轨道
    if (index === -1) {
      //
      const domChildren = this.target!.childNodes;
      // 权重 dom个数*dom宽度，越小，越优先塞入新弹幕
      // 获取弹幕容器的高度
      const { height } = this.target!.getBoundingClientRect();
      // 初始化弹幕轨道，默认全部是空闲状态 idle 空闲标志
      const widthCount = new Array(Math.floor(height / trackHeight)).fill(0);
      // 拿到每一个轨道当前拥有所有的dom的宽度
      domChildren?.forEach((dom) => {
        this.tracks.forEach((_tracks, index) => {
          // 获取dom的轨道下标
          if (index === Number((dom as HTMLDivElement).dataset.track)) {
            // 当前轨道宽度相加
            widthCount[index] += (dom as HTMLDivElement).clientWidth;
          }
        });
      });
      let smallCount = {
        width: 9999,
        index: [] as number[],
      };
      // 将宽度为0的置为空闲轨道,并使用该轨道发送弹幕
      widthCount.forEach((item, index) => {
        if (item === 0) {
          this.tracks[index] = 'idle';
          readyIndex.push(index);
        }
      });
      if (readyIndex.length > 0) {
        index = readyIndex[Math.floor(Math.random() * readyIndex.length)];
      } else {
        widthCount.forEach((item, index) => {
          // 向宽度最小的轨道(不是刚刚发过的轨道)中发送弹幕
          if (smallCount.width >= item && this.tracks[index] !== 'running' && !readyIndex.length) {
            // 如果不是最小值，重置
            if (smallCount.width > item) {
              smallCount.width = item;
              smallCount.index = [index];
              // 如果是最小值，将所有下标收集
            } else {
              smallCount.index.push(index);
            }
          }
        });
        // 从当前权重最低的轨道下标中，拿到再domChildren中最靠前的
        domChildren.forEach((dom) => {
          if (index > -1) return;
          if (smallCount.index.includes(Number((dom as HTMLDivElement).dataset.track))) {
            index = Number((dom as HTMLDivElement).dataset.track);
            return;
          }
        });
      }
    }
    // 当前发送弹幕的轨道状态为running，无法向running状态的轨道发送新弹幕
    if (index !== -1) {
      this.tracks[index] = 'running';
    }
    return index;
  }

  /**
   *
   * @param item 发送的内容 string或者Element
   * @param opts 配置项 不写使用全局配置
   * @returns 弹幕添加方法
   */
  push(item: any, opts: Partial<IOptionsProps> = {}) {
    const options = Object.assign({}, this.options, opts);
    const { onStart, onEnd, top, trackHeight, sendTimes } = options;

    // 弹幕容器
    const bulletContainer = getContainer({
      ...options,
      // 当前class信息，也就是当前弹幕容器内的所有信息，状态
      currScreen: this,
    });
    // 加入当前存在的弹幕列表
    this.bullets.push(bulletContainer);
    // 当前要加入的弹幕轨道下标
    const curTrackIndex = this.getTrackIndex(trackHeight);
    // 如果当前轨道下标是-1（没有轨道发送弹幕）或者是暂停状态
    if (curTrackIndex === -1 || this.allPaused) {
      // 考虑到全部暂停的情景
      this.queues.push([item, bulletContainer, top]);
    } else {
      // 渲染
      this._render(item, bulletContainer, curTrackIndex, sendTimes!, top);
    }

    if (onStart) {
      // 创建一个监听弹幕动画开始的事件
      bulletContainer.addEventListener('animationstart', () => {
        if (onStart) {
          // eslint-disable-next-line @typescript-eslint/ban-types
          (onStart as Function).call(null, bulletContainer.id, this);
        }
      });
    }

    // 创建一个监听弹幕动画完成的事件 删除弹幕动画完成的dom节点
    bulletContainer.addEventListener('animationend', () => {
      // 如果设置了动画完成自定义函数，则执行
      if (onEnd) {
        // eslint-disable-next-line @typescript-eslint/ban-types
        (onEnd as Function).call(null, bulletContainer.id, this);
      }
      // 获取动画结束的dom节点，准备进行清除
      this.bullets = this.bullets.filter(function (obj) {
        return obj.id !== bulletContainer.id;
      });
      bulletContainer.remove();
    });
  }

  /**
   * 渲染弹幕方法
   * @param item 弹幕内容
   * @param container 承载弹幕的容器
   * @param track 弹幕轨道下标
   * @param sendTimes 弹幕发送频率
   * @param top 高度
   */
  _render = (item: string | Element, container: HTMLDivElement, track: number, sendTimes: number, top?: number) => {
    const { gap, trackHeight } = this.options;

    // 弹幕渲染进屏幕,如果是有效组件
    if (React.isValidElement(item) || typeof item === 'string') {
      // 将弹幕容器的位置放到对应的轨道中
      const update = () => {
        const trackTop = track * trackHeight;
        container.dataset.track = `${track}`;
        container.style.top = `${top ?? trackTop}px`;
        const options = {
          root: this.target,
          rootMargin: `0px ${gap} 0px 0px`,
          threshold: 1.0,
        };
        // 拿到当前弹幕的信息
        // 提供了一种异步观察目标元素与其祖先元素或顶级文档视口（viewport）交叉状态的方法。其祖先元素或视口被称为根（root）
        // https://developer.mozilla.org/zh-CN/docs/Web/API/IntersectionObserver
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const { intersectionRatio } = entry;
            // 如果0，则目标在视野外
            if (intersectionRatio >= 1) {
              // 当前弹幕渲染后，判断是否有存积的弹幕，有则渲染
              if (this.queues.length) {
                const [item, container, customTop] = this.queues.shift();
                this._render(item, container, track, this.options.sendTimes!, customTop);
              }
            }
          });
        }, options);
        observer.observe(container);
      };
      const root = createRoot(container);
      root.render(typeof item === 'string' ? <span>{item}</span> : item);
      update();
      // TODO: 计算每一个弹幕的实际宽度
      //如果不写，苹果会有问题，苹果无法识别transform的-100%
      container.style.width = '100%';
      // 将渲染出来的弹幕dom节点，添加到弹幕容器中
      this.target?.appendChild(container);
      // 不可连续发送两次弹幕在一条轨道,本次发送时，上次发送轨道为running状态
      let timer = setTimeout(() => {
        this.tracks[track] = 'data';
        clearTimeout(timer);
      }, sendTimes * 3);
    }
  };

  /** 切换动画状态 */
  _toggleAnimateStatus = (id: string, status = 'paused') => {
    const currItem = this.bullets.find((item) => item.id === id);
    if (currItem) {
      currItem.style.animationPlayState = status;
      return;
    }

    this.allPaused = status === 'paused' ? true : false;
    this.bullets.forEach((item) => {
      item.style.animationPlayState = status;
    });
  };
  pause(id: string) {
    this._toggleAnimateStatus(id, 'paused');
  }
  resume(id: string) {
    this._toggleAnimateStatus(id, 'running');
  }
  /** 隐藏方法 */
  hide() {
    this.allHide = true;
    this.bullets.forEach((item) => {
      item.style.opacity = '0';
    });
  }

  /** 展示方法 */
  show() {
    this.allHide = false;
    this.bullets.forEach((item) => {
      item.style.opacity = '1';
    });
  }

  /** 清除弹幕 */
  clear(id: string) {
    const currItem = this.bullets.find((item) => item.id === id);
    if (currItem) {
      document.getElementById(id)?.remove();
      currItem.remove();
      this.bullets = this.bullets.filter(function (item) {
        return item.id !== id;
      });
      return;
    }
    this.bullets.forEach((item) => {
      document.getElementById(item.id)?.remove();
      item.remove();
    });
    const { height } = this.target!.getBoundingClientRect();
    this.tracks = new Array(Math.floor(height / this.options.trackHeight)).fill('idle');
    this.queues = [];
    this.bullets = [];
  }
}
