import React from 'react'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

interface ListingDetailsProps {
  title: string
  bulletPoints: string[]
  description: string
  marketplace: string
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBulletPointChange: (index: number, value: string) => void
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}

export function ListingDetails({
  title,
  bulletPoints,
  description,
  marketplace,
  onTitleChange,
  onBulletPointChange,
  onDescriptionChange,
}: ListingDetailsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold mb-2 border-b pb-1">Listing Details</h3>
      </div>

      <div className="col-span-1">
        <Label htmlFor="marketplace">Marketplace</Label>
        <Input
          id="marketplace"
          name="marketplace"
          value={marketplace}
          placeholder="e.g., Amazon, eBay, etc."
          className="mt-1"
          disabled
          required
        />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" value={title} onChange={onTitleChange} className="mt-1" required />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="bullet_points">Bullet Points</Label>
        <div className="space-y-2 mt-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="flex items-center">
              <span className="mr-2 text-muted-foreground">•</span>
              <Input
                id={`bullet_point_${index}`}
                value={bulletPoints[index] || ''}
                onChange={(e) => onBulletPointChange(index, e.target.value)}
                placeholder={`Bullet point ${index + 1}`}
                className="flex-grow"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={onDescriptionChange}
          rows={4}
          className="mt-1"
          required
        />
      </div>
    </div>
  )
}
