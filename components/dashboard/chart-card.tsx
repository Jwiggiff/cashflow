import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ChartCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, children, className }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4">
        {children}
      </CardContent>
    </Card>
  )
} 