'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useHelpStore, type HelpTopic } from '@/store/help'
import { useTranslation } from '@/hooks/useTranslation'
import { Mic, LayoutDashboard, Receipt, Tag, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const TOPICS: { id: HelpTopic; icon: React.ElementType; label: { en: string; es: string } }[] = [
  { id: 'voice',      icon: Mic,            label: { en: 'Voice Input',   es: 'Voz' } },
  { id: 'expenses',   icon: Receipt,        label: { en: 'Expenses',      es: 'Gastos' } },
  { id: 'dashboard',  icon: LayoutDashboard,label: { en: 'Dashboard',     es: 'Panel' } },
  { id: 'categories', icon: Tag,            label: { en: 'Categories',    es: 'Categorías' } },
  { id: 'recurring',  icon: RefreshCw,      label: { en: 'Recurring',     es: 'Recurrentes' } },
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
            ? 'Haz clic en el botón "+ Añadir gasto" en la parte superior de la página de gastos, o usa el micrófono para entrada por voz.'
            : 'Click the "+ Add expense" button at the top of the expenses page, or use the microphone for voice input.'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Filtrar y buscar' : 'Filter & search'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Usa la barra de búsqueda y filtros para encontrar gastos por fecha, categoría, monto o método de pago.'
            : 'Use the search bar and filters to find expenses by date, category, amount, or payment method.'}
        </p>
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
          {isEs ? 'Recibos' : 'Receipts'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Al editar un gasto puedes adjuntar una foto del recibo. También puedes usar el escáner de recibos para extraer datos automáticamente.'
            : 'When editing an expense you can attach a receipt photo. You can also use the receipt scanner to extract data automatically.'}
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
          {isEs ? 'Resumen de gastos' : 'Spending overview'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'El panel muestra el total gastado, comparativa con el mes anterior y las tendencias de gasto por período.'
            : 'The dashboard shows total spending, comparison with the previous month, and spending trends over time.'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Gráficos' : 'Charts'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'El gráfico de pastel muestra el desglose por categoría. El gráfico de barras muestra la tendencia mensual. Pasa el cursor sobre los elementos para ver detalles.'
            : 'The pie chart shows breakdown by category. The bar chart shows monthly trend. Hover over items to see details.'}
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">
          {isEs ? 'Espacios de trabajo' : 'Workspaces'}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isEs
            ? 'Usa el selector de espacio en la parte superior para cambiar entre diferentes espacios (personal, negocio, etc.). Los datos son independientes por espacio.'
            : 'Use the workspace selector at the top to switch between different spaces (personal, business, etc.). Data is separate per workspace.'}
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

const TOPIC_CONTENT: Record<HelpTopic, React.ComponentType<{ lang: string }>> = {
  voice: VoiceHelp,
  expenses: ExpensesHelp,
  dashboard: DashboardHelp,
  categories: CategoriesHelp,
  recurring: RecurringHelp,
}

export function HelpSidebar() {
  const { isOpen, activeTopic, closeHelp, setTopic } = useHelpStore()
  const { lang } = useTranslation()
  const isEs = lang === 'es'

  const TopicContent = TOPIC_CONTENT[activeTopic]

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) closeHelp() }}>
      <SheetContent side="right" className="w-full sm:max-w-[420px] flex flex-col p-0 gap-0">
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
