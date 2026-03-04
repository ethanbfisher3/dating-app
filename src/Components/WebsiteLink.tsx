import React from 'react'
import { TouchableOpacity, Text, Linking } from 'react-native'

type WebsiteLinkProps = {
  href?: string
  children?: React.ReactNode
  onPress?: () => void
  style?: any
}

// Simple link component: opens external URLs. For internal navigation,
// pass an `onPress` that calls navigation.navigate.
export default function WebsiteLink({ href, children, onPress, style }: WebsiteLinkProps) {
  const handle = () => {
    if (onPress) return onPress()
    if (!href) return
    // if looks like external URL
    if (href.startsWith('http')) {
      Linking.openURL(href).catch(() => {})
    }
  }

  return (
    <TouchableOpacity onPress={handle}>
      <Text style={[{ color: '#1e90ff' }, style]}>{children}</Text>
    </TouchableOpacity>
  )
}
