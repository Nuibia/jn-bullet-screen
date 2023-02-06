import BulletScreen from '@/components/BulletScreen';
import { FC, useEffect } from 'react';
import styles from './index.less';

let bulletScreen: BulletScreen | undefined = undefined;
let timer: NodeJS.Timer | undefined = undefined;
const sendTimes = 1200;

const ConfessionWall: FC = () => {
  useEffect(() => {
    if (!bulletScreen) {
      bulletScreen = new BulletScreen('#confessionWallId', {
        trackHeight: 30,
        duration: 10,
        sendTimes,
        pauseOnClick: false,
      });
    }
    let index = 0;
    timer = setInterval(() => {
      bulletScreen!.push(
        <div className="confessionItem">
          <div className="senderAvatar">
            <img src="" alt="头像" />
          </div>
          <span className="context">弹幕内容</span>
        </div>,
      );
      index++;
    }, sendTimes);
    return () => {
      clearInterval(timer);
      bulletScreen = undefined;
    };
  }, []);

  return (
    <div className={styles.confessionWallContainer}>
      <div className={styles.confessionWall}>
        <div className={styles.confessionWallContent} id="confessionWallId" />
      </div>
    </div>
  );
};

export default ConfessionWall;
