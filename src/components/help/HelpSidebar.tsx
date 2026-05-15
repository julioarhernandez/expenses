'use client'

import { useHelpStore, type HelpTopic } from '@/store/help'
import { useTranslation } from '@/hooks/useTranslation'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Mic, LayoutDashboard, Receipt, Tag, RefreshCw, Settings, FileDown, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const TOPICS: { id: HelpTopic; icon: React.ElementType; label: { en: string; es: string } }[] = [
  { id: 'voice',      icon: Mic,            label: { en: 'Voice Input',   es: 'Voz' } },
  { id: 'expenses',   icon: Receipt,        label: { en: 'Expenses',      es: 'Gastos' } },
  { id: 'dashboard',  icon: LayoutDashboard,label: { en: 'Dashboard',     es: 'Panel' } },
  { id: 'reports',    icon: FileDown,       label: { en: 'Reports',       es: 'Reportes' } },
  { id: 'categories', icon: Tag,            label: { en: 'Categories',    es: 'Categorías' } },
  { id: 'recurring',  icon: RefreshCw,      label: { en: 'Recurring',     es: 'Recurrentes' } },
  { id: 'settings',   icon: Settings,       label: { en: 'Settings',      es: 'Ajustes' } },
  { id: 'workspaces', icon: LayoutDashboard,label: { en: 'Workspaces',    es: 'Espacios' } },
]

function VoiceHelp({ lang }: { lang: string }) {
  const isEs = lang === 'es'
  const examples = isEs
    ? [
        'Desayuno en Starbucks hoy 12 dólares',
        'Gasolina en Shell ayer 45 dólares tarjeta de crédito',
        'Supermercado Walmart el lunes 85 dólares',
        'Netflix este mes 15.99 dólares',
        'Taxi al aeropuerto 30 dólares efectivo',
      ]
    : [
        'Coffee at Starbucks today 12 dollars',
        'Gas at Shell yesterday 45 dollars credit card',
        'Groceries at Walmart on Monday 85 dollars',
        'Netflix this month 15.99 dollars',
        'Taxi to the airport 30 dollars cash',
      ]

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          {isEs ? '¿Cómo funciona?' : 'How it works'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Presiona el botón del micrófono y habla en voz alta. La IA extrae automáticamente el comercio, monto, fecha y método de pago para pre-rellenar el formulario. Revisa los datos y guarda.'
            : 'Press the microphone button and speak naturally. The AI automatically extracts the merchant, amount, date, and payment method to pre-fill the form. Review the details and save.'}
        </p>
      </div>

      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">
          {isEs ? 'Estructura recomendada' : 'Recommended structure'}
        </h3>
        <div className="bg-card rounded-xl px-4 py-3 text-sm font-mono text-indigo-500 border border-border shadow-sm">
          {isEs
            ? '[Comercio] [cuándo] [monto] [método de pago]'
            : '[Merchant] [when] [amount] [payment method]'}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">
          {isEs ? 'Ejemplos' : 'Examples'}
        </h3>
        <ul className="space-y-3">
          {examples.map((ex) => (
            <li key={ex} className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border/50 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                <Mic className="h-4 w-4 text-indigo-500" />
              </div>
              <span className="text-sm text-foreground font-medium italic">"{ex}"</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-muted/20 rounded-2xl p-5 border border-dashed border-border">
        <h3 className="text-sm font-bold text-foreground mb-3">
          {isEs ? 'Consejos rápidos' : 'Quick Tips'}
        </h3>
        <ul className="space-y-2.5 text-sm text-muted-foreground">
          {(isEs ? [
            'Habla claro y a velocidad normal.',
            'Menciona la fecha si no es hoy (ayer, el lunes, el 5 de mayo...).',
            'Especifica el método: efectivo, tarjeta, transferencia...',
            'Si la IA falla, edita manualmente el formulario que se abre.',
            'El idioma de reconocimiento se ajusta en Configuración.',
          ] : [
            'Speak clearly at a natural pace.',
            'Mention the date if it\'s not today (yesterday, Monday, May 5th...).',
            'Specify the method: cash, credit, transfer...',
            'If the AI misses something, edit the form manually.',
            'Voice language can be changed in Settings.',
          ]).map((tip) => (
            <li key={tip} className="flex items-start gap-3">
              <div className="w-1 h-1 rounded-full bg-indigo-500 mt-2 shrink-0" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ExpensesHelp({ lang }: { lang: string }) {
  const isEs = lang === 'es'
  return (
    <div className="space-y-6">
      <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
        <h3 className="text-sm font-bold text-foreground mb-2">
          {isEs ? 'Añadir un gasto' : 'Adding an expense'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Haz clic en "+ Añadir gasto" en la parte superior, o usa el micrófono para entrada por voz. El formulario incluye comercio, monto, fecha, categoría, método de pago, impuesto y notas.'
            : 'Click "+ Add expense" at the top, or use the microphone for voice input. The form covers merchant, amount, date, category, payment method, tax, and notes.'}
        </p>
      </div>

      <div className="grid gap-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 ml-1">
          {isEs ? 'Panel de filtros' : 'Filter panel'}
        </h3>
        {(isEs ? [
          { t: 'Búsqueda', d: 'Escribe para filtrar por comercio o notas.' },
          { t: 'Categoría', d: 'Muestra solo gastos de una categoría.' },
          { t: 'Fecha', d: 'Chips rápidos (este mes, anterior...) o rango personalizado.' },
          { t: 'Monto', d: 'Filtra por mayor/menor que, igual a o entre rangos.' },
          { t: 'Tipo', d: 'Diferencia entre gastos únicos o recurrentes.' },
        ] : [
          { t: 'Search', d: 'Type to filter by merchant or notes.' },
          { t: 'Category', d: 'Show only expenses of one category.' },
          { t: 'Date', d: 'Quick chips (this month, last...) or custom range.' },
          { t: 'Amount', d: 'Filter by greater/less than, equal or between ranges.' },
          { t: 'Type', d: 'Distinguish between one-time or recurring expenses.' },
        ]).map((item) => (
          <div key={item.t} className="bg-card p-4 rounded-xl border border-border shadow-sm">
            <h4 className="text-sm font-bold text-foreground mb-1">{item.t}</h4>
            <p className="text-sm text-muted-foreground leading-snug">{item.d}</p>
          </div>
        ))}
      </div>

      <div className="bg-muted/20 rounded-2xl p-5 border border-dashed border-border">
        <h3 className="text-sm font-bold text-foreground mb-2">{isEs ? 'Escáner de recibos' : 'Receipt scanner'}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Al añadir o editar un gasto, sube una foto o PDF del recibo. La IA lee el texto y pre-rellena automáticamente comercio, monto, fecha y categoría.'
            : 'When adding or editing an expense, upload a photo or PDF of the receipt. The AI reads the text and auto-fills merchant, amount, date, and category.'}
        </p>
      </div>
    </div>
  )
}

function DashboardHelp({ lang }: { lang: string }) {
  const isEs = lang === 'es'
  return (
    <div className="space-y-6">
      <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
        <h3 className="text-sm font-bold text-foreground mb-2">
          {isEs ? 'Tarjetas de resumen' : 'Summary cards'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Muestran el total gastado, número de transacciones, promedio y comparativa (↑ ↓). Haz clic en cualquier tarjeta para ir a los gastos filtrados.'
            : 'Show total spending, transaction count, average, and comparison (↑ ↓). Click any card to jump to the filtered expenses page.'}
        </p>
      </div>

      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
        <h4 className="text-sm font-bold text-foreground mb-3">{isEs ? 'Selector de período' : 'Period selector'}</h4>
        <div className="grid grid-cols-2 gap-2">
          {['Mensual', 'Trimestral', 'Semestral', 'Anual'].map(l => (
            <div key={l} className="px-3 py-2 bg-muted/50 rounded-xl text-xs font-bold text-foreground text-center border border-border/30">{l}</div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
          {isEs 
            ? 'Elige el período específico (ej. T1 2024) para actualizar todos los gráficos y reportes.'
            : 'Pick the specific period (e.g. Q1 2024) to update all charts and reports.'}
        </p>
      </div>

      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
        <h4 className="text-sm font-bold text-foreground mb-2">{isEs ? 'Gráficos interactivos' : 'Interactive charts'}</h4>
        <ul className="space-y-3">
          {(isEs ? [
            'Tendencia — Compara visualmente con el período anterior.',
            'Por categoría — Haz clic en una barra para ver el detalle.',
            'Método de pago — Desglose de cómo pagaste.',
          ] : [
            'Trend — Visually compare with the previous period.',
            'By category — Click a bar to see the details.',
            'Payment method — Breakdown of how you paid.',
          ]).map(tip => (
            <li key={tip} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ReportsHelp({ lang }: { lang: string }) {
  const isEs = lang === 'es'
  return (
    <div className="space-y-6">
      <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
        <h3 className="text-sm font-bold text-foreground mb-2">{isEs ? '¿Dónde están?' : 'Where are they?'}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Los controles de exportación están en el Dashboard, dentro del panel de filtros. Selecciona el período que quieras antes de exportar.'
            : 'Export controls are on the Dashboard, inside the filter panel. Select the period you want before exporting.'}
        </p>
      </div>

      <div className="grid gap-4">
        {[
          { 
            t: isEs ? 'CSV — Legible' : 'CSV — Readable', 
            d: isEs ? 'Encabezados claros, montos con símbolo y fechas formateadas. Ideal para Excel.' : 'Clear headers, amounts with symbols, and formatted dates. Ideal for Excel.' 
          },
          { 
            t: isEs ? 'CSV — Procesamiento' : 'CSV — Processing', 
            d: isEs ? 'Datos limpios, fechas ISO (YYYY-MM-DD), sin símbolos. Para importar en otros sistemas.' : 'Clean data, ISO dates (YYYY-MM-DD), no symbols. For importing into other systems.' 
          },
          { 
            t: 'PDF', 
            d: isEs ? 'Reporte profesional del período seleccionado, listo para compartir o imprimir.' : 'Professional report for the selected period, ready to share or print.' 
          }
        ].map(item => (
          <div key={item.t} className="bg-card p-4 rounded-xl border border-border shadow-sm">
            <h4 className="text-sm font-bold text-foreground mb-1">{item.t}</h4>
            <p className="text-sm text-muted-foreground leading-snug">{item.d}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CategoriesHelp({ lang }: { lang: string }) {
  const isEs = lang === 'es'
  return (
    <div className="space-y-6">
      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
        <h3 className="text-base font-bold text-foreground mb-2">{isEs ? 'Gestionar categorías' : 'Managing categories'}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Ve a Ajustes → Categorías para crear, editar o eliminar categorías. Cada una tiene su propio color para identificarla fácilmente en gráficos.'
            : 'Go to Settings → Categories to create, edit, or delete categories. Each has its own color for easy identification in charts.'}
        </p>
      </div>
      <div className="bg-muted/20 rounded-2xl p-5 border border-dashed border-border">
        <h4 className="text-sm font-bold text-foreground mb-2">{isEs ? 'Asignación automática' : 'Automatic assignment'}</h4>
        <p className="text-sm text-muted-foreground">
          {isEs 
            ? 'La IA sugiere categorías automáticamente al usar el micrófono basándose en el nombre del comercio.'
            : 'The AI automatically suggests categories when using voice input based on the merchant name.'}
        </p>
      </div>
    </div>
  )
}

function RecurringHelp({ lang }: { lang: string }) {
  const isEs = lang === 'es'
  return (
    <div className="space-y-6">
      <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
        <h3 className="text-sm font-bold text-foreground mb-2">{isEs ? 'Gastos Automáticos' : 'Automatic Expenses'}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Ideal para suscripciones, alquiler o seguros. Se generan solos según la frecuencia: diario, semanal, mensual o anual.'
            : 'Ideal for subscriptions, rent, or insurance. They are generated automatically based on frequency: daily, weekly, monthly, or yearly.'}
        </p>
      </div>
      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
        <h4 className="text-sm font-bold text-foreground mb-2">{isEs ? '¿Cómo crear uno?' : 'How to create one?'}</h4>
        <p className="text-sm text-muted-foreground">
          {isEs 
            ? 'Al añadir un gasto, activa el interruptor "Gasto recurrente" y elige la frecuencia y fecha de inicio.'
            : 'When adding an expense, enable the "Recurring expense" toggle and choose the frequency and start date.'}
        </p>
      </div>
    </div>
  )
}

function SettingsHelp({ lang }: { lang: string }) {
  const isEs = lang === 'es'
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {[
          { 
            t: isEs ? 'Idioma y Voz' : 'Language & Voice', 
            d: isEs ? 'Cambia el idioma de la app y del reconocimiento de voz en Preferencias.' : 'Change the app language and voice recognition language in Preferences.' 
          },
          { 
            t: isEs ? 'Modo Oscuro' : 'Dark Mode', 
            d: isEs ? 'Ajusta el tema visual para mayor comodidad en Preferencias.' : 'Adjust the visual theme for better comfort in Preferences.' 
          }
        ].map(item => (
          <div key={item.t} className="bg-card p-4 rounded-xl border border-border shadow-sm">
            <h4 className="text-sm font-bold text-foreground mb-1">{item.t}</h4>
            <p className="text-sm text-muted-foreground leading-snug">{item.d}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function WorkspacesHelp({ lang }: { lang: string }) {
  const isEs = lang === 'es'
  return (
    <div className="space-y-6">
      <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
        <h3 className="text-sm font-bold text-foreground mb-2">
          {isEs ? 'Separar Finanzas' : 'Separate Finances'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Crea múltiples espacios para separar tus gastos personales de los de tu negocio o proyectos secundarios. Cada espacio tiene sus propias categorías y reportes.'
            : 'Create multiple workspaces to keep your personal expenses separate from your business or side projects. Each workspace has its own categories and reports.'}
        </p>
      </div>
      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm">
        <h4 className="text-sm font-bold text-foreground mb-2">{isEs ? 'Cambiar de espacio' : 'Switching workspaces'}</h4>
        <p className="text-sm text-muted-foreground">
          {isEs 
            ? 'Usa el selector en la esquina superior derecha de cualquier pantalla para cambiar rápidamente entre tus espacios de trabajo.'
            : 'Use the selector in the top-right corner of any screen to quickly switch between your active workspaces.'}
        </p>
      </div>
    </div>
  )
}

const TOPIC_CONTENT: Record<HelpTopic, React.ComponentType<{ lang: string }>> = {
  voice: VoiceHelp,
  expenses: ExpensesHelp,
  dashboard: DashboardHelp,
  reports: ReportsHelp,
  categories: CategoriesHelp,
  recurring: RecurringHelp,
  settings: SettingsHelp,
  workspaces: WorkspacesHelp,
}

export function HelpSidebar() {
  const { isOpen, activeTopic, closeHelp, setTopic } = useHelpStore()
  const { lang } = useTranslation()
  const pathname = usePathname()
  const isEs = lang === 'es'

  // Auto-close help when navigating to a different page
  useEffect(() => {
    if (isOpen) {
      closeHelp()
    }
  }, [pathname, closeHelp]) // Only trigger on path changes

  if (!isOpen) return null

  const TopicContent = TOPIC_CONTENT[activeTopic]

  return (
    <div className="fixed inset-x-0 top-0 bottom-16 z-[60] bg-background flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl border-r border-border/10">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border/50 flex items-center h-16 px-4 shrink-0">
        <button 
          onClick={closeHelp}
          className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <div className="flex flex-col ml-1">
          <h1 className="text-lg font-bold text-foreground leading-tight">
            {isEs ? 'Centro de ayuda' : 'Help Center'}
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {isEs ? 'Documentación' : 'Documentation'}
          </p>
        </div>
      </header>

      {/* Main Content Scroll Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Topic Selector (App-style chips) */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md px-4 py-4 border-b border-border/30">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {TOPICS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setTopic(id)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border',
                  activeTopic === id
                    ? 'bg-foreground text-background border-foreground shadow-md'
                    : 'bg-background text-muted-foreground border-border hover:border-foreground/30'
                )}
              >
                <Icon className={cn("h-4 w-4", activeTopic === id ? "text-background" : "text-indigo-500")} />
                {label[lang as 'en' | 'es'] ?? label.en}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Topic Content */}
        <div className="px-6 py-8 pb-12">
          <TopicContent lang={lang} />
        </div>

        {/* Footer info */}
        <footer className="px-6 py-10 border-t border-border/30 bg-muted/20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-3xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-foreground">Nova Expense Tracker</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isEs ? 'v2.4.0 — Hecho con amor para tus finanzas' : 'v2.4.0 — Made with love for your finances'}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
