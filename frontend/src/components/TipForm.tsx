'use client'

interface TipFormProps {
  amount: string
  setAmount: (amount: string) => void
  onSubmit: () => void
  isPending: boolean
  currency: string
  placeholder: string
}

export function TipForm({ amount, setAmount, onSubmit, isPending, currency, placeholder }: TipFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (amount && !isPending) {
      onSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="amount" className="block text-sm font-semibold text-gray-200 mb-3">
          Amount ({currency})
        </label>
        <div className="relative">
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={placeholder}
            step="0.0001"
            min="0"
            className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-xl transition-all duration-300"
            disabled={isPending}
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <span className="text-gray-300 font-semibold text-sm bg-white/10 px-3 py-1 rounded-lg">
              {currency}
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!amount || isPending || parseFloat(amount) <= 0}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-2xl font-bold hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:scale-100"
      >
        {isPending ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
            <span>Processing Transaction...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Send {currency} Tip</span>
          </div>
        )}
      </button>
    </form>
  )
}
