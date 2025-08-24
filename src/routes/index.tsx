import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className='flex-1 w-full bg-gray-100 relative p-10'>
      <div className='max-w-xl space-y-4'>
        <h1 className='text-3xl font-semibold'>Blurred-Shape Mesh Gradient Generator</h1>
        <p className='text-gray-600'>Start designing beautiful blurred meshes.</p>
        <Link to={'/editor'} className='inline-flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2'>Open Editor</Link>
      </div>
    </div>
  )
}
