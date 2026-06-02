import pygame
import random
import math
import sys
from pygame import gfxdraw

# 初始化Pygame
pygame.init()

# 屏幕设置
WIDTH, HEIGHT = 1200, 800
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("高级雪花降落场景")
clock = pygame.time.Clock()
FPS = 60

# 颜色定义
SKY_COLOR_TOP = (30, 40, 80)    # 天空顶部颜色（深蓝）
SKY_COLOR_BOTTOM = (50, 70, 120) # 天空底部颜色（浅蓝）
MOUNTAIN_COLOR = (80, 90, 110)  # 远山颜色
SNOW_MOUNTAIN_COLOR = (230, 240, 255) # 雪山颜色
TREE_TRUNK = (80, 50, 30)       # 树干颜色
TREE_FOLIAGE = (20, 80, 30)     # 树叶颜色（深绿）
SNOW_COLOR = (255, 255, 255)    # 雪花颜色


class Snowflake:
    """雪花粒子类，包含位置、大小、速度和旋转属性"""
    def __init__(self):
        self.reset()
        self.rotation = random.uniform(0, 360)  # 初始旋转角度
        self.rotation_speed = random.uniform(-1, 1)  # 旋转速度

    def reset(self):
        """重置雪花位置（当雪花飘落出屏幕时）"""
        self.x = random.randint(-100, WIDTH + 100)  # 左右超出屏幕范围，避免突然出现
        self.y = random.randint(-100, -20)          # 从屏幕顶部外开始飘落
        self.size = random.uniform(1, 5)            # 雪花大小（1-5像素）
        self.speed_y = random.uniform(1, 4)         # 垂直下落速度（大雪花下落更快）
        self.speed_x = random.uniform(-0.5, 0.5)    # 水平漂移速度
        self.opacity = random.uniform(150, 255)     # 透明度（150-255）

    def update(self, wind_offset=0):
        """更新雪花位置和旋转角度"""
        # 应用风力影响（鼠标X轴位置控制）
        self.speed_x += wind_offset * 0.001
        self.speed_x = max(-2, min(2, self.speed_x))  # 限制水平速度

        # 更新位置
        self.x += self.speed_x
        self.y += self.speed_y

        # 更新旋转角度
        self.rotation += self.rotation_speed

        # 当雪花飘落出屏幕底部或左右边界时重置
        if self.y > HEIGHT + 20 or self.x < -100 or self.x > WIDTH + 100:
            self.reset()

    def draw(self, surface):
        """绘制雪花（带旋转效果的六边形）"""
        # 创建雪花表面（带透明度）
        snow_surf = pygame.Surface((int(self.size * 2), int(self.size * 2)), pygame.SRCALPHA)
        # 绘制六边形雪花
        points = []
        for i in range(6):
            angle = math.radians(self.rotation + i * 60)
            radius = self.size
            x = self.size + radius * math.cos(angle)
            y = self.size + radius * math.sin(angle)
            points.append((x, y))
        gfxdraw.aapolygon(snow_surf, points, (255, 255, 255, int(self.opacity)))
        gfxdraw.filled_polygon(snow_surf, points, (255, 255, 255, int(self.opacity)))
        # 绘制到屏幕
        surface.blit(snow_surf, (int(self.x - self.size), int(self.y - self.size)))


class SnowyTree:
    """雪树类，包含树干和带积雪的树冠"""
    def __init__(self, x, y, scale=1.0):
        self.x = x          # 树干底部X坐标
        self.y = y          # 树干底部Y坐标
        self.scale = scale  # 缩放比例（控制树的大小）
        self.trunk_height = int(50 * scale)  # 树干高度
        self.trunk_width = int(8 * scale)    # 树干宽度
        # 树冠参数（三角形堆叠）
        self.foliage_layers = 3  # 树冠层数
        self.foliage_base_width = int(60 * scale)
        self.foliage_height = int(40 * scale)

    def draw(self, surface):
        """绘制雪树"""
        # 绘制树干
        trunk_x = self.x - self.trunk_width // 2
        trunk_y = self.y - self.trunk_height
        pygame.draw.rect(
            surface, TREE_TRUNK,
            (trunk_x, trunk_y, self.trunk_width, self.trunk_height)
        )

        # 绘制树冠（带积雪的三角形）
        for i in range(self.foliage_layers):
            layer_scale = 1 - i * 0.2  # 上层树冠缩小
            layer_width = int(self.foliage_base_width * layer_scale)
            layer_height = int(self.foliage_height * layer_scale)
            # 树冠位置（从下到上堆叠）
            foliage_x = self.x - layer_width // 2
            foliage_y = trunk_y - (i + 1) * layer_height * 0.7
            # 绘制树叶（深绿色三角形）
            points = [
                (foliage_x, foliage_y + layer_height),
                (foliage_x + layer_width, foliage_y + layer_height),
                (foliage_x + layer_width // 2, foliage_y)
            ]
            pygame.draw.polygon(surface, TREE_FOLIAGE, points)
            # 绘制积雪（顶部白色三角形，比树叶小）
            snow_height = layer_height * 0.3
            snow_points = [
                (foliage_x + layer_width * 0.2, foliage_y + snow_height),
                (foliage_x + layer_width * 0.8, foliage_y + snow_height),
                (foliage_x + layer_width // 2, foliage_y)
            ]
            pygame.draw.polygon(surface, SNOW_COLOR, snow_points)


def draw_gradient_sky(surface):
    """绘制渐变天空背景"""
    for y in range(HEIGHT):
        # 计算颜色渐变比例（从上到下）
        ratio = y / HEIGHT
        r = int(SKY_COLOR_TOP[0] * (1 - ratio) + SKY_COLOR_BOTTOM[0] * ratio)
        g = int(SKY_COLOR_TOP[1] * (1 - ratio) + SKY_COLOR_BOTTOM[1] * ratio)
        b = int(SKY_COLOR_TOP[2] * (1 - ratio) + SKY_COLOR_BOTTOM[2] * ratio)
        pygame.draw.line(surface, (r, g, b), (0, y), (WIDTH, y))


def draw_mountains(surface):
    """绘制多层雪山和远山（带深度模糊效果）"""
    # 远山（模糊效果，颜色较深，位置靠后）
    distant_points = [
        (0, HEIGHT * 0.6), (WIDTH * 0.2, HEIGHT * 0.4), (WIDTH * 0.4, HEIGHT * 0.55),
        (WIDTH * 0.6, HEIGHT * 0.35), (WIDTH * 0.8, HEIGHT * 0.5), (WIDTH, HEIGHT * 0.45),
        (WIDTH, HEIGHT), (0, HEIGHT)
    ]
    pygame.draw.polygon(surface, MOUNTAIN_COLOR, distant_points)

    # 中景雪山（清晰，颜色较浅，位置靠前）
    snow_mountain_points = [
        (0, HEIGHT * 0.55), (WIDTH * 0.15, HEIGHT * 0.3), (WIDTH * 0.3, HEIGHT * 0.45),
        (WIDTH * 0.5, HEIGHT * 0.25), (WIDTH * 0.7, HEIGHT * 0.4), (WIDTH * 0.9, HEIGHT * 0.3),
        (WIDTH, HEIGHT * 0.4), (WIDTH, HEIGHT), (0, HEIGHT)
    ]
    pygame.draw.polygon(surface, SNOW_MOUNTAIN_COLOR, snow_mountain_points)

    # 雪山顶部积雪高光（更亮的白色）
    highlight_points = [
        (WIDTH * 0.15, HEIGHT * 0.3), (WIDTH * 0.2, HEIGHT * 0.28), (WIDTH * 0.3, HEIGHT * 0.45),
        (WIDTH * 0.5, HEIGHT * 0.25), (WIDTH * 0.6, HEIGHT * 0.32), (WIDTH * 0.9, HEIGHT * 0.3)
    ]
    pygame.draw.polygon(surface, (240, 245, 255), highlight_points)


def main():
    # 创建雪花粒子系统（200个雪花）
    snowflakes = [Snowflake() for _ in range(200)]
    
    # 创建一些树木
    trees = [
        SnowyTree(WIDTH * 0.1, HEIGHT * 0.8, 1.5),
        SnowyTree(WIDTH * 0.25, HEIGHT * 0.85, 1.2),
        SnowyTree(WIDTH * 0.4, HEIGHT * 0.8, 1.8),
        SnowyTree(WIDTH * 0.6, HEIGHT * 0.82, 1.3),
        SnowyTree(WIDTH * 0.75, HEIGHT * 0.86, 1.1),
        SnowyTree(WIDTH * 0.9, HEIGHT * 0.8, 1.4),
    ]
    
    # 主循环
    running = True
    while running:
        clock.tick(FPS)
        
        # 事件处理
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
        
        # 获取鼠标位置控制风力
        mouse_x = pygame.mouse.get_pos()[0]
        wind_offset = mouse_x - WIDTH / 2
        
        # 绘制背景
        draw_gradient_sky(screen)
        draw_mountains(screen)
        
        # 绘制树木
        for tree in trees:
            tree.draw(screen)
        
        # 更新和绘制雪花
        for snowflake in snowflakes:
            snowflake.update(wind_offset)
            snowflake.draw(screen)
        
        # 更新屏幕
        pygame.display.flip()
    
    # 退出程序
    pygame.quit()
    sys.exit()


if __name__ == "__main__":
    main()