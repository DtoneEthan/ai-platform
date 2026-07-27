import {
  Languages,
  Brain,
  Crown,
  Workflow,
  MapPin,
  Barcode,
  Scale,
  Moon,
  Sparkles,
  ExternalLink,
  LayoutGrid,
} from 'lucide-react';

interface Work {
  title: string;
  url: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const works: Work[] = [
  {
    title: '多语填字游戏',
    url: 'https://dtoneethan.github.io/polyglot-crossword/',
    description: '用多种语言玩填字游戏，边玩边轻松记忆外语单词。',
    icon: <Languages size={22} />,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'MBTI 性格测试',
    url: 'https://dtoneethan.github.io/mbti-test/',
    description: '几分钟内测出你的性格类型，了解自我与人际相处之道。',
    icon: <Brain size={22} />,
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: '东家象棋',
    url: 'https://dtoneethan.github.io/dongjia-xiangqi/',
    description: '传统中国象棋玩法，支持人机对弈，随时来一局。',
    icon: <Crown size={22} />,
    color: 'from-amber-500 to-orange-500',
  },
  {
    title: 'PackFlow',
    url: 'https://dtoneethan.github.io/packflow/',
    description: '轻量级的任务与流程管理工具，让工作更有条理。',
    icon: <Workflow size={22} />,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'GeoPlace',
    url: 'https://dtoneethan.github.io/geoplace/',
    description: '探索全球地理坐标与地点信息，地图可视化一目了然。',
    icon: <MapPin size={22} />,
    color: 'from-rose-500 to-red-500',
  },
  {
    title: '条形码生成器',
    url: 'https://dtoneethan.github.io/barcode-generator/',
    description: '一键生成多种格式的条形码，方便商品与资产管理。',
    icon: <Barcode size={22} />,
    color: 'from-indigo-500 to-blue-500',
  },
  {
    title: '单位转换器',
    url: 'https://dtoneethan.github.io/unit-converter/',
    description: '支持上百种常用单位换算，日常计算的小帮手。',
    icon: <Scale size={22} />,
    color: 'from-lime-500 to-green-500',
  },
  {
    title: '爻杯占卜',
    url: 'https://dtoneethan.github.io/jiaobei-divination/',
    description: '传统爻杯问卜，趣味体验，给生活一点仪式感。',
    icon: <Moon size={22} />,
    color: 'from-slate-500 to-gray-600',
  },
  {
    title: '塔罗占卜',
    url: 'https://dtoneethan.github.io/tarot-divination/',
    description: '在线塔罗牌阵，静心抽牌，探索内心深处的答案。',
    icon: <Sparkles size={22} />,
    color: 'from-fuchsia-500 to-violet-500',
  },
];

export default function Works() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 标题区 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
            <LayoutGrid size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Ethan.X 工作室作品</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            精心打磨的小工具与趣味应用，每一款都可在线免费使用
          </p>
        </div>

        {/* 作品网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {works.map((work) => (
            <a
              key={work.url}
              href={work.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-[var(--color-bg-secondary)] border border-[var(--color-border)]
                         rounded-xl p-5 transition-all duration-200
                         hover:border-[var(--color-accent)] hover:-translate-y-1
                         hover:shadow-lg hover:shadow-indigo-500/5"
            >
              <div
                className={`w-11 h-11 rounded-xl bg-gradient-to-br ${work.color}
                            flex items-center justify-center text-white mb-4
                            group-hover:scale-110 transition-transform duration-200`}
              >
                {work.icon}
              </div>
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-1.5 flex items-center gap-1.5">
                {work.title}
                <ExternalLink
                  size={14}
                  className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {work.description}
              </p>
            </a>
          ))}
        </div>

        {/* 页脚 */}
        <div className="text-center mt-12 pt-6 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-muted)]">
            © Ethan.X 工作室 · 用 ❤️ 与代码打造
          </p>
        </div>
      </div>
    </div>
  );
}
