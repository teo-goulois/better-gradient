import { createFileRoute } from '@tanstack/react-router'
import { MeshPreview } from '@/components/mesh/mesh-preview'
import { useEffect } from 'react'
import { useMeshStore } from '@/store/store-mesh'

export const Route = createFileRoute('/share/$state')({
  component: Share,
})

function Share() {
  const params = Route.useParams()
  const fromShareString = useMeshStore((s) => s.fromShareString)

  useEffect(() => {
    if (params.state) fromShareString(params.state)
  }, [params.state, fromShareString])

  return (
    <div className='flex-1 w-full bg-gray-100 relative'>
      <MeshPreview />
    </div>
  )
}


