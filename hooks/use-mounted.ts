import * as React from "react"

// This hook is used to determine whether a component has mounted or not.


export function useMounted() {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return mounted
}
