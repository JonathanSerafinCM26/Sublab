import re

with open('d:/Ruben/Sublab/frontend/src/components/Evolution/Evolution.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add recharts imports
content = re.sub(
    r"import \{ TrendingUp, Activity, Calendar, Award, ArrowLeft, Heart \} from 'lucide-react'",
    "import { TrendingUp, Activity, Calendar, Award, ArrowLeft, Heart } from 'lucide-react'\nimport { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'",
    content
)

# Replace history
history_replacement = """    history: [
        { day: 'Lun', bienestar: 45, estres: 90 },
        { day: 'Mar', bienestar: 50, estres: 80 },
        { day: 'Mié', bienestar: 55, estres: 85 },
        { day: 'Jue', bienestar: 65, estres: 60 },
        { day: 'Vie', bienestar: 75, estres: 50 },
        { day: 'Sáb', bienestar: 85, estres: 40 },
        { day: 'Dom', bienestar: 90, estres: 30 }
    ],"""
content = re.sub(
    r"    history: \[(.*?)\]\,",
    history_replacement,
    content,
    flags=re.DOTALL
)

# Replace Activity Chart (Mock) section
chart_replacement = """            {/* Activity Chart (Recharts) */}
            <div className="activity-card card animate-fadeInUp stagger-1" style={{ overflow: 'hidden' }}>
                <div className="card-header-row mb-4">
                    <h3 className="card-title"><Calendar size={18} /> Balance Semanal</h3>
                </div>
                <div className="chart-container" style={{ height: '220px', width: '100%', padding: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockData.history} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorBienestar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorEstres" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--error)" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="var(--error)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--surface-elevated)', borderRadius: '12px', border: 'none', color: 'var(--text)', boxShadow: 'var(--shadow-sm)' }}
                                itemStyle={{ fontWeight: 600 }}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <Area type="monotone" dataKey="bienestar" name="Bienestar" stroke="var(--accent)" strokeWidth={3} fillOpacity={1} fill="url(#colorBienestar)" />
                            <Area type="monotone" dataKey="estres" name="Estrés" stroke="var(--error)" strokeWidth={3} fillOpacity={1} fill="url(#colorEstres)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>"""

content = re.sub(
    r"            \{\/\* Activity Chart \(Mock\) \*\/\}.*?<\/div>(\s+)\{\/\* Metrics Cards \*\/\}",
    chart_replacement + r"\1{/* Metrics Cards */}",
    content,
    flags=re.DOTALL
)

with open('d:/Ruben/Sublab/frontend/src/components/Evolution/Evolution.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

