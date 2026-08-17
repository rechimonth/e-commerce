$lines = Get-Content 'src/services/ordersService.ts'
$newLines = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    if ($i -eq 3) { $newLines += '  createOrder as firestoreCreateOrder,' }
    elseif ($i -eq 4) { $newLines += '  getUserOrders as firestoreGetUserOrders,' }
    elseif ($i -eq 5) { $newLines += '  getAllOrders as firestoreGetAllOrders,' }
    elseif ($i -eq 6) { $newLines += '  updateOrderStatus as firestoreUpdateOrderStatus,' }
    elseif ($i -eq 7) { $newLines += '  getOrder as firestoreGetOrder,' }
    elseif ($i -eq 8) { $newLines += '} from ''@/infrastructure/firebase/firestore'';' }
    elseif ($i -eq 59) { $newLines += '  async fetchUserOrders(userId: string): Promise<Order[]> {' }
    elseif ($i -eq 60) { $newLines += '    return firebaseTryCatch(async () => {' }
    elseif ($i -eq 61) { $newLines += '      const dtos = await firestoreGetUserOrders(userId);' }
    elseif ($i -eq 62) { $newLines += '      return dtos.map(toOrder);' }
    elseif ($i -eq 63) { $newLines += '    });' }
    elseif ($i -eq 64) { $newLines += '  },' }
    else { $newLines += $line }
}
$newLines | Set-Content 'src/services/ordersService.ts'
