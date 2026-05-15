'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useHelpStore, type HelpTopic } from '@/store/help'
import { useTranslation } from '@/hooks/useTranslation'
import { Mic, LayoutDashboard, Receipt, Tag, RefreshCw, Settings, FileDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const TOPICS: { id: HelpTopic; icon: React.ElementType; label: { en: string; es: string } }[] = [
  { id: 'voice',      icon: Mic,            label: { en: 'Voice Input',   es: 'Voz' } },
  { id: 'expenses',   icon: Receipt,        label: { en: 'Expenses',      es: 'Gastos' } },
  { id: 'dashboard',  icon: LayoutDashboard,label: { en: 'Dashboard',     es: 'Panel' } },
  { id: 'reports',    icon: FileDown,       label: { en: 'Reports',       es: 'Reportes' } },
  { id: 'categories', icon: Tag,            label: { en: 'Categories',    es: 'Categorías' } },
  { id: 'recurring',  icon: RefreshCw,      label: { en: 'Recurring',     es: 'Recurrentes' } },
  { id: 'settings',   icon: Settings,       label: { en: 'Settings',      es: 'Ajustes' } },
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
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? '¿Cómo funciona?' : 'How it works'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Presiona el botón del micrófono y habla en voz alta. La IA extrae automáticamente el comercio, monto, fecha y método de pago para pre-rellenar el formulario. Revisa los datos y guarda.'
            : 'Press the microphone button and speak naturally. The AI automatically extracts the merchant, amount, date, and payment method to pre-fill the form. Review the details and save.'}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">
          {isEs ? 'Estructura recomendada' : 'Recommended structure'}
        </h3>
        <div className="bg-muted/60 rounded-xl px-4 py-3 text-sm font-mono text-muted-foreground border border-border/50">
          {isEs
            ? '[Comercio] [cuándo] [monto] [método de pago]'
            : '[Merchant] [when] [amount] [payment method]'}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">
          {isEs ? 'Ejemplos' : 'Examples'}
        </h3>
        <ul className="space-y-2">
          {examples.map((ex) => (
            <li key={ex} className="flex items-start gap-2.5">
              <Mic className="h-3.5 w-3.5 mt-0.5 text-indigo-500 shrink-0" />
              <span className="text-sm text-muted-foreground italic">"{ex}"</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">
          {isEs ? 'Consejos' : 'Tips'}
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {(isEs ? [
            'Habla claro y a velocidad normal.',
            'Menciona la fecha si no es hoy (ayer, el lunes, el 5 de mayo...).',
            'Puedes decir el método: efectivo, tarjeta de crédito, débito.',
            'Si la IA falla, edita manualmente el formulario que se abre.',
            'El idioma de reconocimiento se ajusta en Configuración.',
          ] : [
            'Speak clearly at a natural pace.',
            'Mention the date if it\'s not today (yesterday, Monday, May 5th...).',
            'You can say the payment method: cash, credit card, debit.',
            'If the AI misses something, edit the form that opens.',
            'Voice language can be changed in Settings.',
          ]).map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold mt-0.5">·</span>
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
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Añadir un gasto' : 'Adding an expense'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Haz clic en "+ Añadir gasto" en la parte superior, o usa el micrófono para entrada por voz. El formulario incluye comercio, monto, fecha, categoría, método de pago, impuesto y notas.'
            : 'Click "+ Add expense" at the top, or use the microphone for voice input. The form covers merchant, amount, date, category, payment method, tax, and notes.'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Panel de filtros' : 'Filter panel'}
        </h3>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {(isEs ? [
            'Búsqueda — escribe para filtrar por comercio o notas.',
            'Categoría — muestra solo gastos de una categoría.',
            'Fecha — chips rápidos: este mes, mes anterior, últimos 3 meses, este año, o rango personalizado.',
            'Monto — filtra por menor que, mayor que, igual a, o entre dos valores.',
            'Tipo — todos, solo recurrentes, o solo únicos.',
          ] : [
            'Search — type to filter by merchant or notes.',
            'Category — show only expenses of one category.',
            'Date — quick chips: this month, last month, last 3 months, this year, or custom range.',
            'Amount — filter by less than, greater than, equal to, or between two values.',
            'Type — all, recurring only, or one-time only.',
          ]).map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold mt-0.5 shrink-0">·</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Editar o eliminar' : 'Edit or delete'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Haz clic en el ícono ⋮ al inicio de cada fila para editar o eliminar un gasto.'
            : 'Click the ⋮ icon at the start of each row to edit or delete an expense.'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Escáner de recibos' : 'Receipt scanner'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Al añadir o editar un gasto, sube una foto o PDF del recibo. La IA lee el texto y pre-rellena automáticamente comercio, monto, fecha y categoría.'
            : 'When adding or editing an expense, upload a photo or PDF of the receipt. The AI reads the text and auto-fills merchant, amount, date, and category.'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Exportar CSV' : 'Export CSV'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Usa el botón "Exportar CSV" en la parte superior para descargar todos los gastos visibles (con los filtros activos) como archivo CSV.'
            : 'Use the "Export CSV" button at the top to download all visible expenses (with active filters applied) as a CSV file.'}
        </p>
      </div>
    </div>
  )
}

function DashboardHelp({ lang }: { lang: string }) {
  const isEs = lang === 'es'
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Tarjetas de resumen' : 'Summary cards'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Las tarjetas en la parte superior muestran el total gastado, número de transacciones, promedio por transacción y comparativa con el período anterior (↑ ↓). Haz clic en cualquier tarjeta para ir a los gastos filtrados por ese período.'
            : 'The cards at the top show total spending, transaction count, average per transaction, and comparison with the prior period (↑ ↓). Click any card to jump to the expenses page filtered to that period.'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Selector de período' : 'Period selector'}
        </h3>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {(isEs ? [
            'Mensual — elige el mes y año específico.',
            'Trimestral — elige el trimestre (T1–T4) y año.',
            'Semestral — elige el semestre (S1 ene–jun, S2 jul–dic) y año.',
            'Anual — vista de todo el año.',
          ] : [
            'Monthly — pick a specific month and year.',
            'Quarterly — pick the quarter (Q1–Q4) and year.',
            'Semi-annual — pick the half (H1 Jan–Jun, H2 Jul–Dec) and year.',
            'Yearly — full year view.',
          ]).map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold mt-0.5 shrink-0">·</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Gráficos' : 'Charts'}
        </h3>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {(isEs ? [
            'Tendencia de gasto — gráfico de barras con el gasto por subperíodo. Compara visualmente con el período anterior.',
            'Por categoría — barras horizontales con el gasto acumulado por categoría. Haz clic en una categoría para ver esos gastos.',
            'Método de pago — desglose de cómo pagaste (tarjeta, efectivo, etc.).',
          ] : [
            'Spending trend — bar chart of spending per sub-period. Visually compares with the prior period.',
            'By category — horizontal bars with total spending per category. Click a category to see those expenses.',
            'Payment method — breakdown of how you paid (card, cash, etc.).',
          ]).map((tip) => (
            <li key={tip} className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold mt-0.5 shrink-0">·</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Comparar espacios de trabajo' : 'Compare workspaces'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Si tienes más de un espacio de trabajo, aparecen casillas en el panel de filtros. Marca varios para ver y comparar el gasto de cada uno lado a lado en los gráficos.'
            : 'If you have more than one workspace, checkboxes appear in the filter panel. Check multiple to view and compare spending across them side by side in the charts.'}
        </p>
      </div>
    </div>
  )
}

function ReportsHelp({ lang }: { lang: string }) {
  const isEs = lang === 'es'
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? '¿Dónde están los reportes?' : 'Where are reports?'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Los controles de exportación están en el Panel principal, dentro del panel de filtros, en la fila inferior. Selecciona el período que quieras antes de exportar.'
            : 'Export controls are on the Dashboard, inside the filter panel, in the bottom row. Select the period you want before exporting.'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'CSV — Legible' : 'CSV — Readable'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Exporta un CSV formateado para lectura fácil: encabezados en mayúsculas, montos con símbolo de moneda, fechas en formato largo. Ideal para revisar en Excel o Google Sheets.'
            : 'Exports a CSV formatted for easy reading: capitalized headers, amounts with currency symbol, long-format dates. Ideal for reviewing in Excel or Google Sheets.'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'CSV — Procesamiento' : 'CSV — Processing'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Exporta un CSV limpio para importar en otras herramientas o sistemas: valores numéricos sin formato, fechas en ISO 8601 (YYYY-MM-DD), sin símbolo de moneda.'
            : 'Exports a clean CSV for importing into other tools or systems: unformatted numeric values, ISO 8601 dates (YYYY-MM-DD), no currency symbol.'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'PDF' : 'PDF'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Descarga un reporte PDF del período seleccionado, listo para imprimir o compartir con un contador o cliente.'
            : 'Download a PDF report of the selected period, ready to print or share with an accountant or client.'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Exportar desde Gastos' : 'Export from Expenses'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'La página de Gastos también tiene un botón "Exportar CSV" que descarga exactamente los gastos visibles con los filtros activos aplicados.'
            : 'The Expenses page also has an "Export CSV" button that downloads exactly the visible expenses with any active filters applied.'}
        </p>
      </div>
    </div>
  )
}

function CategoriesHelp({ lang }: { lang: string }) {
  const isEs = lang === 'es'
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Gestionar categorías' : 'Managing categories'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Ve a Configuración → Categorías para crear, editar o eliminar categorías. Cada categoría tiene un nombre y un color.'
            : 'Go to Settings → Categories to create, edit, or delete categories. Each category has a name and a color.'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Asignar a gastos' : 'Assign to expenses'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Al añadir o editar un gasto, selecciona una categoría del menú desplegable. La IA también sugiere categorías automáticamente al usar el micrófono.'
            : 'When adding or editing an expense, select a category from the dropdown. The AI also suggests categories automatically when using voice input.'}
        </p>
      </div>
    </div>
  )
}

function RecurringHelp({ lang }: { lang: string }) {
  const isEs = lang === 'es'
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? '¿Qué son los gastos recurrentes?' : 'What are recurring expenses?'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Los gastos recurrentes se generan automáticamente según la frecuencia que definas (diario, semanal, mensual o anual). Ideal para suscripciones, alquiler, seguros, etc.'
            : 'Recurring expenses are generated automatically on the frequency you define (daily, weekly, monthly, or yearly). Ideal for subscriptions, rent, insurance, etc.'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Crear uno' : 'Creating one'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Al añadir un gasto, activa la opción "Gasto recurrente" y selecciona la frecuencia y fecha de inicio.'
            : 'When adding an expense, enable the "Recurring expense" toggle and select the frequency and start date.'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Editar o cancelar' : 'Edit or cancel'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Haz clic en ⋮ en cualquier gasto recurrente de la tabla para editar la plantilla o cancelar la recurrencia completa.'
            : 'Click ⋮ on any recurring expense row to edit the template or cancel the entire recurrence.'}
        </p>
      </div>
    </div>
  )
}

function SettingsHelp({ lang }: { lang: string }) {
  const isEs = lang === 'es'
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Espacios de trabajo' : 'Workspaces'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Crea espacios separados para personal, negocio, freelance u otros proyectos. Cada espacio tiene sus propias categorías, gastos y configuración independiente.'
            : 'Create separate spaces for personal, business, freelance, or other projects. Each workspace has its own categories, expenses, and independent settings.'}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Categorías' : 'Categories'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Crea, edita y elimina categorías para organizar tus gastos. Las categorías son compartidas en todos tus espacios de trabajo: un cambio aplica en todos.'
            : 'Create, edit, and delete categories to organize your expenses. Categories are shared across all your workspaces — a change applies everywhere.'}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Idioma de la app' : 'App language'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Cambia el idioma de la interfaz entre English y Español en Ajustes → Preferencias.'
            : 'Switch the interface language between English and Español in Settings → Preferences.'}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Idioma de voz' : 'Voice language'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Elige el idioma que usa el micrófono para reconocer tu voz: English (US) o Español (ES). Encuéntralo en Ajustes → Preferencias.'
            : 'Choose the language the microphone uses to recognize your voice: English (US) or Español (ES). Find it in Settings → Preferences.'}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Modo oscuro' : 'Dark mode'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Activa o desactiva el tema oscuro desde Ajustes → Preferencias. La preferencia se guarda automáticamente.'
            : 'Toggle dark mode on or off from Settings → Preferences. Your preference is saved automatically.'}
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
}

export function HelpSidebar() {
  const { isOpen, activeTopic, closeHelp, setTopic } = useHelpStore()
  const { lang } = useTranslation()
  const isEs = lang === 'es'

  const TopicContent = TOPIC_CONTENT[activeTopic]

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) closeHelp() }}>
      <SheetContent side="right" className="w-full sm:max-w-none flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <SheetTitle className="text-base font-semibold">
            {isEs ? 'Centro de ayuda' : 'Help Center'}
          </SheetTitle>
        </SheetHeader>

        {/* Topic tabs */}
        <div className="flex gap-1 px-4 pt-4 pb-2 flex-wrap shrink-0">
          {TOPICS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTopic(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeTopic === id
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-3 w-3" />
              {label[lang as 'en' | 'es'] ?? label.en}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <TopicContent lang={lang} />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 shrink-0">
          <p className="text-[11px] text-muted-foreground text-center">
            {isEs
              ? 'Nova — Rastreo de gastos inteligente'
              : 'Nova — Smart expense tracking'}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
